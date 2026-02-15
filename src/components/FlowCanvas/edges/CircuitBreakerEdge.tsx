import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

type CircuitBreakerState = 'closed' | 'open' | 'half_open';

interface CircuitBreakerEdgeData {
  cbState?: CircuitBreakerState;
  [key: string]: unknown;
}

const stateColors: Record<CircuitBreakerState, string> = {
  closed: '#22c55e',    // green
  open: '#ef4444',      // red
  half_open: '#eab308', // yellow
};

const stateLabels: Record<CircuitBreakerState, string> = {
  closed: 'Closed',
  open: 'Open',
  half_open: 'Half Open',
};

export function CircuitBreakerEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps) {
  const edgeData = data as CircuitBreakerEdgeData | undefined;
  const cbState: CircuitBreakerState = edgeData?.cbState ?? 'closed';
  const color = stateColors[cbState];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={style} markerEnd={markerEnd} />
      <foreignObject
        width={20}
        height={20}
        x={labelX - 10}
        y={labelY - 10}
        requiredExtensions="http://www.w3.org/1999/xhtml"
      >
        <div
          title={`Circuit Breaker: ${stateLabels[cbState]}`}
          style={{
            width: 14,
            height: 14,
            borderRadius: '50%',
            backgroundColor: color,
            border: '2px solid rgba(0,0,0,0.5)',
            margin: '3px',
            cursor: 'default',
          }}
        />
      </foreignObject>
    </>
  );
}
