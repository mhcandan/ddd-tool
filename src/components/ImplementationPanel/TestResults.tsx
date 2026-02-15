import { useState } from 'react';
import { Check, X, RefreshCw, Wrench, ChevronDown, ChevronRight } from 'lucide-react';
import { useImplementationStore } from '../../stores/implementation-store';
import { CopyButton } from '../shared/CopyButton';
import type { TestCase } from '../../types/implementation';

export function TestResults() {
  const testResults = useImplementationStore((s) => s.testResults);
  const runTests = useImplementationStore((s) => s.runTests);
  const fixFailingTest = useImplementationStore((s) => s.fixFailingTest);
  const [expandedTests, setExpandedTests] = useState<Set<string>>(new Set());

  if (!testResults) return null;

  const { total, passed, failed, duration, cases } = testResults;

  const toggleExpand = (name: string) => {
    setExpandedTests((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <div className="border-t border-border">
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-primary">Test Results</span>
          <div className="flex-1" />
          <button
            className="btn-icon !p-1"
            onClick={runTests}
            title="Re-run tests"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1">
          <span className="text-success">{passed} passing</span>
          {failed > 0 && (
            <>
              {' · '}
              <span className="text-danger">{failed} failing</span>
            </>
          )}
          {' · '}
          <span>{duration.toFixed(2)}s</span>
          {total === 0 && ' (no tests detected)'}
        </p>
      </div>

      {cases.length > 0 && (
        <ul className="px-4 py-2 space-y-1 max-h-[200px] overflow-y-auto">
          {cases.map((tc) => (
            <TestCaseRow
              key={tc.name}
              testCase={tc}
              expanded={expandedTests.has(tc.name)}
              onToggle={() => toggleExpand(tc.name)}
              onFix={() => fixFailingTest(tc)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TestCaseRow({
  testCase,
  expanded,
  onToggle,
  onFix,
}: {
  testCase: TestCase;
  expanded: boolean;
  onToggle: () => void;
  onFix: () => void;
}) {
  const isPassed = testCase.status === 'passed';

  return (
    <li>
      <div
        className="flex items-center gap-2 cursor-pointer hover:bg-bg-hover rounded px-1 py-0.5"
        onClick={onToggle}
      >
        {isPassed ? (
          <Check className="w-3 h-3 text-success shrink-0" />
        ) : (
          <X className="w-3 h-3 text-danger shrink-0" />
        )}
        <span className="text-xs text-text-primary flex-1 truncate">
          {testCase.name}
        </span>
        {testCase.duration > 0 && (
          <span className="text-[10px] text-text-muted">
            {testCase.duration < 1
              ? `${Math.round(testCase.duration * 1000)}ms`
              : `${testCase.duration.toFixed(1)}s`}
          </span>
        )}
        {testCase.error && (
          expanded ? (
            <ChevronDown className="w-3 h-3 text-text-muted shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-text-muted shrink-0" />
          )
        )}
      </div>
      {expanded && testCase.error && (
        <div className="ml-5 mt-1 mb-2">
          <div className="relative">
            <CopyButton text={testCase.error} className="absolute top-0.5 right-0.5" />
            <pre className="text-[10px] font-mono text-danger/80 bg-danger/5 rounded p-2 overflow-x-auto whitespace-pre-wrap">
              {testCase.error}
            </pre>
          </div>
          <button
            className="flex items-center gap-1 mt-1 text-[10px] text-accent hover:text-accent-hover transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              onFix();
            }}
          >
            <Wrench className="w-3 h-3" />
            Fix this test
          </button>
        </div>
      )}
    </li>
  );
}
