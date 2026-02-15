use serde::{Deserialize, Serialize};
use std::env;

/// Resolve an API key: if the value looks like an env var name (ALL_CAPS_UNDERSCORES),
/// read from the environment. Otherwise treat it as a direct key value.
fn resolve_api_key(value: &str) -> Result<String, String> {
    let looks_like_env_var = !value.is_empty()
        && value.chars().all(|c| c.is_ascii_uppercase() || c == '_' || c.is_ascii_digit())
        && value.chars().next().map_or(false, |c| c.is_ascii_uppercase());

    if looks_like_env_var {
        env::var(value)
            .map_err(|_| format!("API key not found. Set the {} environment variable.", value))
    } else if !value.is_empty() {
        // Treat as direct API key
        Ok(value.to_string())
    } else {
        Err("No API key configured.".to_string())
    }
}

#[derive(Debug, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmUsage {
    pub input_tokens: Option<u32>,
    pub output_tokens: Option<u32>,
}

#[derive(Debug, Serialize)]
pub struct LlmChatResponse {
    pub content: String,
    pub usage: Option<LlmUsage>,
}

#[tauri::command]
pub fn get_env_var(name: String) -> Result<String, String> {
    env::var(&name).map_err(|_| format!("Environment variable {} is not set", name))
}

#[tauri::command]
pub async fn llm_chat(
    provider_type: String,
    model: String,
    api_key_env_var: Option<String>,
    base_url: Option<String>,
    messages: Vec<ChatMessage>,
    system_prompt: Option<String>,
    max_tokens: Option<u32>,
) -> Result<LlmChatResponse, String> {
    let client = reqwest::Client::new();
    let max_tok = max_tokens.unwrap_or(4096);

    match provider_type.as_str() {
        "anthropic" => call_anthropic(&client, &model, &api_key_env_var, &messages, &system_prompt, max_tok).await,
        "openai" => call_openai(&client, &model, &api_key_env_var, None, &messages, &system_prompt, max_tok).await,
        "ollama" => call_ollama(&client, &model, &base_url, &messages, &system_prompt).await,
        "openai_compatible" => call_openai(&client, &model, &api_key_env_var, base_url.as_deref(), &messages, &system_prompt, max_tok).await,
        _ => Err(format!("Unknown provider type: {}", provider_type)),
    }
}

async fn call_anthropic(
    client: &reqwest::Client,
    model: &str,
    api_key_env_var: &Option<String>,
    messages: &[ChatMessage],
    system_prompt: &Option<String>,
    max_tokens: u32,
) -> Result<LlmChatResponse, String> {
    let key_input = api_key_env_var.as_deref().unwrap_or("ANTHROPIC_API_KEY");
    let api_key = resolve_api_key(key_input)?;

    let mut body = serde_json::json!({
        "model": model,
        "max_tokens": max_tokens,
        "messages": messages.iter().map(|m| {
            serde_json::json!({ "role": m.role, "content": m.content })
        }).collect::<Vec<_>>(),
    });

    if let Some(sys) = system_prompt {
        body["system"] = serde_json::json!(sys);
    }

    let resp = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", &api_key)
        .header("anthropic-version", "2023-06-01")
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Anthropic request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        return Err(format!("Anthropic API error ({}): {}", status.as_u16(), text));
    }

    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("Failed to parse Anthropic response: {}", e))?;

    let content = json["content"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|block| block["text"].as_str())
        .unwrap_or("")
        .to_string();

    let usage = json.get("usage").map(|u| LlmUsage {
        input_tokens: u["input_tokens"].as_u64().map(|v| v as u32),
        output_tokens: u["output_tokens"].as_u64().map(|v| v as u32),
    });

    Ok(LlmChatResponse { content, usage })
}

async fn call_openai(
    client: &reqwest::Client,
    model: &str,
    api_key_env_var: &Option<String>,
    base_url: Option<&str>,
    messages: &[ChatMessage],
    system_prompt: &Option<String>,
    max_tokens: u32,
) -> Result<LlmChatResponse, String> {
    let url = format!(
        "{}/v1/chat/completions",
        base_url.unwrap_or("https://api.openai.com")
    );

    let key_input = api_key_env_var.as_deref().unwrap_or("OPENAI_API_KEY");
    let api_key = resolve_api_key(key_input)?;

    let mut msgs: Vec<serde_json::Value> = Vec::new();

    if let Some(sys) = system_prompt {
        msgs.push(serde_json::json!({ "role": "system", "content": sys }));
    }

    for m in messages {
        msgs.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": model,
        "max_tokens": max_tokens,
        "messages": msgs,
    });

    let resp = client
        .post(&url)
        .header("Authorization", format!("Bearer {}", api_key))
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("OpenAI request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        return Err(format!("OpenAI API error ({}): {}", status.as_u16(), text));
    }

    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("Failed to parse OpenAI response: {}", e))?;

    let content = json["choices"]
        .as_array()
        .and_then(|arr| arr.first())
        .and_then(|choice| choice["message"]["content"].as_str())
        .unwrap_or("")
        .to_string();

    let usage = json.get("usage").map(|u| LlmUsage {
        input_tokens: u["prompt_tokens"].as_u64().map(|v| v as u32),
        output_tokens: u["completion_tokens"].as_u64().map(|v| v as u32),
    });

    Ok(LlmChatResponse { content, usage })
}

async fn call_ollama(
    client: &reqwest::Client,
    model: &str,
    base_url: &Option<String>,
    messages: &[ChatMessage],
    system_prompt: &Option<String>,
) -> Result<LlmChatResponse, String> {
    let url = format!(
        "{}/api/chat",
        base_url.as_deref().unwrap_or("http://localhost:11434")
    );

    let mut msgs: Vec<serde_json::Value> = Vec::new();

    if let Some(sys) = system_prompt {
        msgs.push(serde_json::json!({ "role": "system", "content": sys }));
    }

    for m in messages {
        msgs.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let body = serde_json::json!({
        "model": model,
        "messages": msgs,
        "stream": false,
    });

    let resp = client
        .post(&url)
        .header("content-type", "application/json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Ollama request failed: {}", e))?;

    let status = resp.status();
    let text = resp.text().await.map_err(|e| format!("Failed to read response: {}", e))?;

    if !status.is_success() {
        return Err(format!("Ollama API error ({}): {}", status.as_u16(), text));
    }

    let json: serde_json::Value = serde_json::from_str(&text)
        .map_err(|e| format!("Failed to parse Ollama response: {}", e))?;

    let content = json["message"]["content"]
        .as_str()
        .unwrap_or("")
        .to_string();

    Ok(LlmChatResponse { content, usage: None })
}
