import { MapPin } from 'lucide-react';
import type { PlaceSuggestion } from '../types/location.types.js';
import { MapyAttribution } from './MapyAttribution.js';

export function PlaceSuggestionList({
  id,
  items,
  activeIndex,
  onSelect,
}: {
  id: string;
  items: PlaceSuggestion[];
  activeIndex: number;
  onSelect: (item: PlaceSuggestion) => void;
}) {
  return (
    <div className="absolute left-0 right-0 top-[4.8rem] z-(--z-popover) overflow-hidden rounded-lg border border-border bg-surface-raised shadow-md">
      <ul id={id} role="listbox" className="max-h-72 overflow-y-auto p-1">
        {items.map((item, index) => (
          <li
            key={`${item.primaryLabel}-${String(item.latitude)}-${String(item.longitude)}`}
            id={`${id}-${String(index)}`}
            role="option"
            aria-selected={index === activeIndex}
          >
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(item)}
              className={`flex min-h-11 w-full gap-3 rounded-md p-2 text-left hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus ${index === activeIndex ? 'bg-selected' : ''}`}
            >
              <MapPin
                className="mt-0.5 size-4 shrink-0 text-primary-emphasis"
                aria-hidden="true"
              />
              <span>
                <span className="block font-medium">{item.primaryLabel}</span>
                <span className="block text-caption text-text-muted">
                  {item.secondaryLabel ?? item.formattedAddress}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="border-t border-border px-3 py-2">
        <MapyAttribution context="Vyhledávání" />
      </div>
    </div>
  );
}
