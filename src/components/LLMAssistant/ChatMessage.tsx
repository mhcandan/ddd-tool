import { Sparkles } from 'lucide-react';
import { useLlmStore } from '../../stores/llm-store';
import { useFlowStore } from '../../stores/flow-store';
import { FlowPreview } from './FlowPreview';
import { CopyButton } from '../shared/CopyButton';
import type { ChatMessage as ChatMessageType } from '../../types/llm';

function renderContent(content: string, msg: ChatMessageType) {
  if (msg.role === 'user') {
    return <p className="text-xs whitespace-pre-wrap">{content}</p>;
  }

  // For assistant messages, render YAML blocks with Apply button
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const regex = /```yaml\s*\n([\s\S]*?)```/g;
  let match;
  let key = 0;

  while ((match = regex.exec(content)) !== null) {
    // Text before the code block
    if (match.index > lastIndex) {
      parts.push(
        <p key={key++} className="text-xs whitespace-pre-wrap">
          {content.slice(lastIndex, match.index)}
        </p>
      );
    }

    const yamlContent = match[1].trim();
    const yamlBlock = msg.yamlBlocks?.find((b) => b.raw === yamlContent);

    parts.push(
      <YamlCodeBlock key={key++} content={yamlContent} hasSpec={!!yamlBlock?.spec} msg={msg} />
    );

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < content.length) {
    parts.push(
      <p key={key++} className="text-xs whitespace-pre-wrap">
        {content.slice(lastIndex)}
      </p>
    );
  }

  return parts.length > 0 ? <>{parts}</> : <p className="text-xs whitespace-pre-wrap">{content}</p>;
}

function YamlCodeBlock({ content, hasSpec, msg }: { content: string; hasSpec: boolean; msg: ChatMessageType }) {
  const selectedNodeId = useFlowStore((s) => s.selectedNodeId);
  const ghostPreview = useLlmStore((s) => s.ghostPreview);

  const handleApply = () => {
    if (!selectedNodeId || !msg.yamlBlocks) return;

    const yamlBlock = msg.yamlBlocks.find((b) => b.raw === content && b.spec);
    if (!yamlBlock?.spec) return;

    const flow = useFlowStore.getState();
    const allNodes = flow.currentFlow
      ? [flow.currentFlow.trigger, ...flow.currentFlow.nodes]
      : [];
    const node = allNodes.find((n) => n.id === selectedNodeId);
    if (!node) return;

    useLlmStore.setState({
      ghostPreview: {
        type: 'spec',
        nodeId: selectedNodeId,
        originalSpec: { ...node.spec },
        suggestedSpec: yamlBlock.spec,
      },
    });
  };

  return (
    <div className="my-1.5 rounded border border-border overflow-hidden">
      <div className="relative">
        <CopyButton text={content} className="absolute top-0.5 right-0.5" />
        <pre className="bg-bg-primary p-2 text-[10px] font-mono text-text-secondary overflow-x-auto">
          {content}
        </pre>
      </div>
      {hasSpec && selectedNodeId && !ghostPreview && (
        <button
          className="w-full text-[10px] text-accent hover:bg-bg-hover py-1 transition-colors flex items-center justify-center gap-1"
          onClick={handleApply}
        >
          <Sparkles className="w-3 h-3" />
          Apply to selected node
        </button>
      )}
    </div>
  );
}

export function ChatMessageBubble({ message }: { message: ChatMessageType }) {
  const isUser = message.role === 'user';
  const isError = !isUser && message.content.startsWith('Error:');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} px-3 py-1`}>
      <div
        className={`max-w-[300px] rounded-lg px-3 py-2 ${
          isUser
            ? 'bg-accent/20 text-text-primary'
            : isError
              ? 'bg-danger/10 text-danger border border-danger/20'
              : 'bg-bg-tertiary text-text-primary'
        }`}
      >
        {renderContent(message.content, message)}
        {message.flowPreview && !isUser && (
          <FlowPreview flow={message.flowPreview} height={160} />
        )}
      </div>
    </div>
  );
}
