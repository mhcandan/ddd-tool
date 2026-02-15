import { useState } from 'react';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  onCreate: (name: string, description: string) => void;
}

export function AddDomainDialog({ onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onCreate(trimmed, description.trim());
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/60 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="card w-full max-w-md mx-4 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-lg font-semibold">Add Domain</h2>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className="label" htmlFor="domain-name">
              Name
            </label>
            <input
              id="domain-name"
              className="input"
              placeholder="e.g. Billing"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="domain-description">
              Description (optional)
            </label>
            <input
              id="domain-description"
              className="input"
              placeholder="What does this domain handle?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-border">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={!name.trim()}
          >
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
