import { Select } from '../../../../components/ui/Select/Select.js';
import type {
  ImportFormat,
  ImportMapping,
  ImportProfile,
} from '../../types/finance-import.types.js';

export function ImportProfilePicker({
  profiles,
  accountId,
  value,
  onApply,
}: {
  profiles: ImportProfile[];
  accountId: string;
  value: string | null | undefined;
  onApply: (format: ImportFormat, mapping: ImportMapping) => void;
}) {
  const available = profiles.filter(
    (profile) => profile.accountId === null || profile.accountId === accountId,
  );
  return (
    <Select
      label="Uložený importní profil"
      value={value ?? ''}
      onChange={(event) => {
        const profile = available.find(
          (candidate) => candidate.id === event.target.value,
        );
        if (!profile) return;
        onApply(
          {
            encoding: profile.encoding,
            delimiter: profile.delimiter,
            quoteCharacter: profile.quoteCharacter,
            hasHeader: profile.hasHeader,
            headerRowNumber: profile.headerRowNumber,
            skipRowsBefore: profile.skipRowsBefore,
            dateFormat: profile.dateFormat,
            decimalSeparator: profile.decimalSeparator,
            thousandSeparator: profile.thousandSeparator,
          },
          {
            amountColumnMode: profile.amountColumnMode,
            columnMapping: profile.columnMappingJson,
            invertAmountSign: profile.invertAmountSign,
            defaultCurrencyCode: profile.defaultCurrencyCode,
            profileId: profile.id,
          },
        );
      }}
    >
      <option value="">Bez uloženého profilu</option>
      {available.map((profile) => (
        <option key={profile.id} value={profile.id}>
          {profile.name}
        </option>
      ))}
    </Select>
  );
}
