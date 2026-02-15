import type { SystemMapArrow, SystemMapDomain } from '../../types/domain';

const BLOCK_WIDTH = 200;
const BLOCK_HEIGHT = 100;

interface Props {
  arrow: SystemMapArrow;
  domains: SystemMapDomain[];
}

export function EventArrow({ arrow, domains }: Props) {
  const source = domains.find((d) => d.id === arrow.sourceDomainId);
  const target = domains.find((d) => d.id === arrow.targetDomainId);
  if (!source || !target) return null;

  const sx = source.position.x + BLOCK_WIDTH / 2;
  const sy = source.position.y + BLOCK_HEIGHT / 2;
  const tx = target.position.x + BLOCK_WIDTH / 2;
  const ty = target.position.y + BLOCK_HEIGHT / 2;

  // Calculate midpoint for label
  const mx = (sx + tx) / 2;
  const my = (sy + ty) / 2;

  const label = arrow.events.join(', ');

  return (
    <g>
      <line
        x1={sx}
        y1={sy}
        x2={tx}
        y2={ty}
        stroke="var(--color-text-muted)"
        strokeWidth={1.5}
        markerEnd="url(#arrowhead)"
      />
      {label && (
        <text
          x={mx}
          y={my - 8}
          textAnchor="middle"
          fill="var(--color-text-muted)"
          fontSize={11}
          className="pointer-events-none select-none"
        >
          {label}
        </text>
      )}
    </g>
  );
}
