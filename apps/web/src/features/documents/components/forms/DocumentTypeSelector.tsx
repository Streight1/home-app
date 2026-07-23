import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  DocumentTypeDefinition,
  DocumentTypeKey,
} from '../../types/document.types.js';

export function DocumentTypeSelector({
  types,
  value,
  disabled,
  onChange,
}: {
  types: readonly DocumentTypeDefinition[];
  value: DocumentTypeKey;
  disabled?: boolean;
  onChange: (value: DocumentTypeKey) => void;
}) {
  return (
    <Select
      label="Typ dokumentu"
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value as DocumentTypeKey)}
    >
      {types.map((type) => (
        <option key={type.key} value={type.key}>
          {type.label}
        </option>
      ))}
    </Select>
  );
}
