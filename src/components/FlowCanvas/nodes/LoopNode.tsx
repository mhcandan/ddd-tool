import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Repeat } from 'lucide-react';
import type { DddNodeData } from '../../../types/flow';
import { NodeValidationDot } from './NodeValidationDot';

type LoopNodeType = Node<DddNodeData, 'loop'>;

function LoopNodeComponent({ data, selected }: NodeProps<LoopNodeType>) {
  const iterator = (data.spec as any)?.iterator;
  const collection = (data.spec as any)?.collection;

  return (
    <div
      className={`relative min-w-[300px] min-h-[200px] bg-teal-500/5 border-2 border-dashed border-teal-500/60 rounded-xl shadow-lg ${
        selected ? 'ring-2 ring-accent' : ''
      }`}
    >
      <NodeValidationDot issues={data.validationIssues} />
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-bg-secondary"
      />
      {/* Header bar */}
      <div className="flex items-center gap-2 px-3 py-2 bg-teal-500/10 rounded-t-[10px] border-b border-teal-500/20">
        <div className="p-1 rounded bg-teal-500/15">
          <Repeat className="w-4 h-4 text-teal-400" />
        </div>
        <span className="text-sm font-medium text-text-primary">
          {data.label}
        </span>
        {(iterator || collection) && (
          <span className="text-[10px] text-text-muted ml-auto">
            {collection && `over: ${collection}`}
            {collection && iterator && ' | '}
            {iterator && `as: ${iterator}`}
          </span>
        )}
      </div>
      {/* Body area for children */}
      <div className="min-h-[140px] p-2" />
      <div className="flex justify-between text-[10px] text-text-muted px-3 pb-1">
        <span>Body</span>
        <span>Done</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="body"
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-bg-secondary"
        style={{ left: '33%' }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="done"
        className="!w-3 !h-3 !bg-text-muted !border-2 !border-bg-secondary"
        style={{ left: '66%' }}
      />
    </div>
  );
}

export const LoopNode = memo(LoopNodeComponent);
