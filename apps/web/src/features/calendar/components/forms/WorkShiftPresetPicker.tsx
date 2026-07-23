import { Button } from '../../../../components/ui/Button/Button.js';
import { workShiftPresets, type WorkShiftPreset } from './workShiftPresets.js';

export function WorkShiftPresetPicker({
  onSelect,
}: {
  onSelect: (preset: WorkShiftPreset) => void;
}) {
  return (
    <div
      className="flex flex-wrap gap-2 sm:col-span-2"
      aria-label="Přednastavené pracovní směny"
    >
      {workShiftPresets.map((preset) => (
        <Button key={preset.key} size="sm" onClick={() => onSelect(preset)}>
          {preset.label}
        </Button>
      ))}
      <span className="inline-flex min-h-11 items-center px-2 text-caption text-text-muted">
        Vlastní čas lze zadat výše.
      </span>
    </div>
  );
}
