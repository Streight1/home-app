import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import {
  CRITICALITY_LABELS,
  LOAD_TYPE_LABELS,
} from '../../lib/expeditionLabels.js';
import type {
  GearCriticality,
  GearLoadType,
  TripPackItemInput,
  TripParticipant,
} from '../../types/expeditions.types.js';

export function TripPackItemEditorRow({
  item,
  participants,
  first,
  last,
  onChange,
  onMove,
  onRemove,
}: {
  item: TripPackItemInput;
  participants: TripParticipant[];
  first: boolean;
  last: boolean;
  onChange: (item: TripPackItemInput) => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}) {
  return (
    <article className="grid gap-3 rounded-lg border border-border bg-surface-raised p-4">
      <div className="flex items-start gap-2">
        <Input
          className="min-w-0 flex-1"
          label="Položka"
          value={item.name}
          onChange={(event) => onChange({ ...item, name: event.target.value })}
        />
        <div className="flex shrink-0 gap-1 pt-7">
          <Button
            type="button"
            size="sm"
            aria-label={`Posunout ${item.name} nahoru`}
            disabled={first}
            onClick={() => onMove(-1)}
          >
            <ArrowUp className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm"
            aria-label={`Posunout ${item.name} dolů`}
            disabled={last}
            onClick={() => onMove(1)}
          >
            <ArrowDown className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            aria-label={`Odstranit ${item.name}`}
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Input
          label="Množství"
          inputMode="decimal"
          value={item.quantity}
          onChange={(event) =>
            onChange({ ...item, quantity: event.target.value })
          }
        />
        <Input
          label="Jednotková hmotnost (g)"
          type="number"
          min={0}
          value={item.unitWeightGrams}
          onChange={(event) =>
            onChange({
              ...item,
              unitWeightGrams: Number(event.target.value),
            })
          }
        />
        <Input
          label="Kategorie"
          value={item.categoryName ?? ''}
          onChange={(event) =>
            onChange({ ...item, categoryName: event.target.value })
          }
        />
        <Select
          label="Typ zatížení"
          value={item.loadType}
          onChange={(event) =>
            onChange({
              ...item,
              loadType: event.target.value as GearLoadType,
            })
          }
        >
          {Object.entries(LOAD_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Kritičnost"
          value={item.criticality}
          onChange={(event) =>
            onChange({
              ...item,
              criticality: event.target.value as GearCriticality,
            })
          }
        >
          {Object.entries(CRITICALITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Nosič"
          value={item.assignedUserId ?? ''}
          onChange={(event) =>
            onChange({
              ...item,
              assignedUserId: event.target.value || null,
            })
          }
        >
          <option value="">Bez přiřazení</option>
          {participants.map((participant) => (
            <option key={participant.id} value={participant.id}>
              {participant.displayName ?? 'Člen domácnosti'}
            </option>
          ))}
        </Select>
        <Input
          label="Umístění v batohu"
          value={item.packLocationLabel ?? ''}
          onChange={(event) =>
            onChange({ ...item, packLocationLabel: event.target.value })
          }
        />
        <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border px-3 text-body-sm font-medium">
          <input
            type="checkbox"
            checked={item.isShared}
            onChange={(event) =>
              onChange({ ...item, isShared: event.target.checked })
            }
          />
          Sdílená položka
        </label>
      </div>
    </article>
  );
}
