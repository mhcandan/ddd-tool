import { useSheetStore } from '../../stores/sheet-store';
import { useProjectStore } from '../../stores/project-store';

export function DomainMapStub() {
  const current = useSheetStore((s) => s.current);
  const domainConfigs = useProjectStore((s) => s.domainConfigs);

  const domainId = current.domainId;
  const domain = domainId ? domainConfigs[domainId] : null;

  return (
    <div className="flex-1 flex items-center justify-center bg-bg-primary">
      <div className="text-center text-text-muted">
        <p className="text-lg font-medium mb-2">
          Domain Map: {domain?.name ?? domainId}
        </p>
        <p className="text-sm">
          Flow blocks and portals will be built in Session 3.
        </p>
      </div>
    </div>
  );
}
