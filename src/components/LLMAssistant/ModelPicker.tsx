import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Check } from 'lucide-react';
import { useAppStore } from '../../stores/app-store';
import { useLlmStore } from '../../stores/llm-store';

export function ModelPicker() {
  const providers = useAppStore((s) => s.settings.llm.providers);
  const selectedModel = useLlmStore((s) => s.selectedModel);
  const setSelectedModel = useLlmStore((s) => s.setSelectedModel);

  const enabledProviders = providers.filter((p) => p.enabled);

  // Determine displayed model name
  const activeModel = (() => {
    if (selectedModel) return selectedModel;
    for (const p of enabledProviders) {
      if (p.models.length > 0) return p.models[0];
    }
    return 'No model';
  })();

  // Shorten model name for display
  const displayName = activeModel.length > 20
    ? activeModel.slice(0, 18) + '...'
    : activeModel;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
          title={activeModel}
        >
          <span className="truncate max-w-[100px]">{displayName}</span>
          <ChevronDown className="w-3 h-3 shrink-0" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-bg-secondary border border-border rounded-lg shadow-lg py-1 min-w-[180px] z-50"
          sideOffset={4}
          align="end"
        >
          {enabledProviders.length === 0 && (
            <div className="px-3 py-2 text-xs text-text-muted">
              No providers enabled
            </div>
          )}

          {enabledProviders.map((provider) => (
            <DropdownMenu.Group key={provider.id}>
              <DropdownMenu.Label className="px-3 py-1 text-[10px] uppercase tracking-wider text-text-muted font-medium">
                {provider.name}
              </DropdownMenu.Label>
              {provider.models.map((model) => (
                <DropdownMenu.Item
                  key={model}
                  className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary hover:text-text-primary hover:bg-bg-hover cursor-pointer outline-none"
                  onSelect={() => setSelectedModel(model)}
                >
                  <span className="w-3.5 flex justify-center">
                    {model === activeModel && <Check className="w-3 h-3 text-accent" />}
                  </span>
                  <span className="truncate">{model}</span>
                </DropdownMenu.Item>
              ))}
            </DropdownMenu.Group>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
