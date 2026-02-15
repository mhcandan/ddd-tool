import { useEffect, useRef } from 'react';
import { Sparkles, X, Trash2 } from 'lucide-react';
import { useLlmStore } from '../../stores/llm-store';
import { useSheetStore } from '../../stores/sheet-store';
import { ChatMessageBubble } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ModelPicker } from './ModelPicker';
import { ThinkingIndicator } from './ThinkingIndicator';

function getScopeKey(): string {
  const sheet = useSheetStore.getState().current;
  if (sheet.level === 'flow' && sheet.domainId && sheet.flowId) {
    return `flow:${sheet.domainId}/${sheet.flowId}`;
  }
  if (sheet.level === 'domain' && sheet.domainId) {
    return `domain:${sheet.domainId}`;
  }
  return 'system';
}

export function ChatPanel() {
  const togglePanel = useLlmStore((s) => s.togglePanel);
  const threads = useLlmStore((s) => s.threads);
  const sending = useLlmStore((s) => s.sending);
  const clearThread = useLlmStore((s) => s.clearThread);

  const sheetLevel = useSheetStore((s) => s.current.level);
  const domainId = useSheetStore((s) => s.current.domainId);
  const flowId = useSheetStore((s) => s.current.flowId);

  // Find thread for current scope
  const scopeKey = getScopeKey();
  const thread = Object.values(threads).find((t) => t.scopeKey === scopeKey);
  const messages = thread?.messages ?? [];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, sending]);

  // Close on Escape — use capture phase so we consume it before Breadcrumb navigates away
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        e.preventDefault();
        togglePanel();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [togglePanel]);

  // Scope label for display
  const scopeLabel = (() => {
    if (sheetLevel === 'flow' && flowId) return flowId;
    if (sheetLevel === 'domain' && domainId) return domainId;
    return 'System';
  })();

  return (
    <div className="w-[360px] bg-bg-secondary border-l border-border flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
        <Sparkles className="w-4 h-4 text-accent shrink-0" />
        <span className="text-sm font-medium text-text-primary flex-1">
          Design Assistant
        </span>
        <ModelPicker />
        {messages.length > 0 && (
          <button
            className="btn-icon !p-1 shrink-0"
            onClick={clearThread}
            title="Clear thread"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          className="btn-icon !p-1 shrink-0"
          onClick={togglePanel}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scope indicator */}
      <div className="px-4 py-1.5 border-b border-border">
        <span className="text-[10px] text-text-muted">
          Scope: <span className="text-text-secondary">{scopeLabel}</span>
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-2">
        {messages.length === 0 && !sending && (
          <div className="flex flex-col items-center justify-center h-full gap-2 px-6 text-center">
            <Sparkles className="w-8 h-8 text-text-muted/30" />
            <p className="text-xs text-text-muted">
              Ask about your design, get spec suggestions, or request a flow review.
            </p>
            <p className="text-[10px] text-text-muted/60">
              Right-click nodes for inline assist
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessageBubble key={msg.id} message={msg} />
        ))}

        {sending && <ThinkingIndicator />}
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  );
}
