import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { IconButton } from '../../../../components/ui/IconButton/IconButton.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type { RecipeInput } from '../../types/meals.types.js';

export function RecipeStepFields({
  value,
  onChange,
}: {
  value: RecipeInput['steps'];
  onChange: (value: RecipeInput['steps']) => void;
}) {
  const update = (index: number, next: Partial<RecipeInput['steps'][number]>) =>
    onChange(
      value.map((step, position) =>
        position === index ? { ...step, ...next } : step,
      ),
    );
  const move = (index: number, offset: -1 | 1) => {
    const target = index + offset;
    if (target < 0 || target >= value.length) return;
    const next = [...value];
    const currentStep = next[index];
    const targetStep = next[target];
    if (!currentStep || !targetStep) return;
    next[index] = targetStep;
    next[target] = currentStep;
    onChange(next);
  };
  return (
    <fieldset className="grid gap-3">
      <legend className="text-section-title font-semibold">Postup</legend>
      {value.map((step, index) => (
        <div
          key={index}
          className="grid gap-3 rounded-lg border border-border p-3"
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
            <Input
              label={`Název kroku ${String(index + 1)}`}
              value={step.title ?? ''}
              onChange={(event) => update(index, { title: event.target.value })}
            />
            <Input
              label="Délka (min)"
              type="number"
              min={1}
              max={1440}
              value={step.durationMinutes ?? ''}
              onChange={(event) =>
                update(index, {
                  durationMinutes: event.target.value
                    ? Number(event.target.value)
                    : undefined,
                })
              }
            />
          </div>
          <Textarea
            label={`Pokyn ${String(index + 1)}`}
            value={step.instruction}
            onChange={(event) =>
              update(index, { instruction: event.target.value })
            }
            required
          />
          <div className="flex justify-end gap-2">
            <IconButton
              type="button"
              aria-label="Posunout krok nahoru"
              onClick={() => move(index, -1)}
              disabled={index === 0}
            >
              <ArrowUp className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              aria-label="Posunout krok dolů"
              onClick={() => move(index, 1)}
              disabled={index === value.length - 1}
            >
              <ArrowDown className="size-4" aria-hidden="true" />
            </IconButton>
            <IconButton
              type="button"
              aria-label="Odstranit krok"
              variant="ghost"
              onClick={() =>
                onChange(value.filter((_, position) => position !== index))
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </IconButton>
          </div>
        </div>
      ))}
      <Button
        type="button"
        onClick={() => onChange([...value, { instruction: '' }])}
      >
        <Plus className="size-4" aria-hidden="true" />
        Přidat krok
      </Button>
    </fieldset>
  );
}
