import type { DomainMapArrow, DomainMapFlow, DomainMapPortal } from '../../types/domain';

const FLOW_WIDTH = 180;
const FLOW_HEIGHT = 80;
const PORTAL_WIDTH = 140;
const PORTAL_HEIGHT = 50;

interface Props {
  arrow: DomainMapArrow;
  flows: DomainMapFlow[];
  portals: DomainMapPortal[];
}

export function DomainEventArrow({ arrow, flows, portals }: Props) {
  const source =
    arrow.sourceType === 'flow'
      ? flows.find((f) => f.id === arrow.sourceId)
      : portals.find((p) => p.id === arrow.sourceId);
  const target =
    arrow.targetType === 'flow'
      ? flows.find((f) => f.id === arrow.targetId)
      : portals.find((p) => p.id === arrow.targetId);

  if (!source || !target) return null;

  const sw = arrow.sourceType === 'flow' ? FLOW_WIDTH : PORTAL_WIDTH;
  const sh = arrow.sourceType === 'flow' ? FLOW_HEIGHT : PORTAL_HEIGHT;
  const tw = arrow.targetType === 'flow' ? FLOW_WIDTH : PORTAL_WIDTH;
  const th = arrow.targetType === 'flow' ? FLOW_HEIGHT : PORTAL_HEIGHT;

  const sx = source.position.x + sw / 2;
  const sy = source.position.y + sh / 2;
  const tx = target.position.x + tw / 2;
  const ty = target.position.y + th / 2;

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
        markerEnd="url(#domain-arrowhead)"
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
