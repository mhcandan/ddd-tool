import { useState, useRef } from 'react';
import { Send } from 'lucide-react';
import { useLlmStore } from '../../stores/llm-store';

export function ChatInput() {
  const [draft, setDraft] = useState('');
  const sending = useLlmStore((s) => s.sending);
  const sendMessage = useLlmStore((s) => s.sendMessage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const trimmed = draft.trim();
    if (!trimmed || sending) return;
    setDraft('');
    sendMessage(trimmed);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex items-end gap-2 px-3 py-3 border-t border-border">
      <textarea
        ref={textareaRef}
        className="input resize-none text-xs flex-1"
        rows={2}
        placeholder="Ask about your design..."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            handleSend();
          }
        }}
        disabled={sending}
      />
      <button
        className="btn-primary !p-2 shrink-0"
        onClick={handleSend}
        disabled={!draft.trim() || sending}
        title="Send (Cmd+Enter)"
      >
        <Send className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
