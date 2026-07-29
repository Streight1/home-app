import { useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';

const ICONS = [
  ['wrench', 'Nářadí'],
  ['flame', 'Topení'],
  ['zap', 'Elektřina'],
  ['droplets', 'Voda'],
  ['wind', 'Vzduchotechnika'],
  ['trees', 'Zahrada'],
  ['shield-check', 'Bezpečnost'],
  ['database-backup', 'Zálohy'],
  ['circle-ellipsis', 'Ostatní'],
] as const;

const COLORS = [
  'violet',
  'blue',
  'cyan',
  'green',
  'amber',
  'orange',
  'rose',
  'pink',
] as const;

export function MaintenanceCategoryForm({
  pending,
  initialValue,
  submitLabel = 'Vytvořit kategorii',
  onCancel,
  onSubmit,
}: {
  pending: boolean;
  initialValue?: { name: string; iconKey: string; colorToken: string };
  submitLabel?: string;
  onCancel: () => void;
  onSubmit: (value: {
    name: string;
    iconKey: string;
    colorToken: string;
  }) => void;
}) {
  const [name, setName] = useState(initialValue?.name ?? '');
  const [iconKey, setIconKey] = useState(initialValue?.iconKey ?? 'wrench');
  const [colorToken, setColorToken] = useState(
    initialValue?.colorToken ?? 'blue',
  );
  return (
    <form
      className="mt-4 grid gap-4 rounded-lg border border-border bg-surface p-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name: name.trim(), iconKey, colorToken });
      }}
    >
      <Input
        label="Název kategorie"
        required
        maxLength={100}
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Ikona"
          value={iconKey}
          onChange={(event) => setIconKey(event.target.value)}
        >
          {ICONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Barva"
          value={colorToken}
          onChange={(event) => setColorToken(event.target.value)}
        >
          {COLORS.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button type="button" onClick={onCancel}>
          Zrušit
        </Button>
        <Button
          type="submit"
          variant="primary"
          loading={pending}
          disabled={!name.trim()}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
