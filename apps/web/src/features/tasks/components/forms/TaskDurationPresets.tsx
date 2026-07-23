import { Button } from '../../../../components/ui/Button/Button.js';

const PRESETS = [
  { label: '30 min', value: '30' },
  { label: '1 h', value: '60' },
  { label: '1 h 30 min', value: '90' },
  { label: '2 h', value: '120' },
] as const;

export function TaskDurationPresets({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div
      className="grid grid-cols-2 gap-2 sm:grid-cols-4"
      aria-label="Rychlá volba délky"
    >
      {PRESETS.map((preset) => {
        const active = value === preset.value;
        return (
          <Button
            key={preset.value}
            type="button"
            size="sm"
            variant={active ? 'primary' : 'secondary'}
            aria-pressed={active}
            onClick={() => onChange(preset.value)}
          >
            {preset.label}
          </Button>
        );
      })}
    </div>
  );
}
