import { useState, useCallback } from 'react';
import { Copy, Check } from 'lucide-react';

interface Props {
  text: string;
  className?: string;
}

export function CopyButton({ text, className = '' }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in some contexts
    }
  }, [text]);

  return (
    <button
      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
        copied
          ? 'text-success'
          : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
      } ${className}`}
      onClick={handleCopy}
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
