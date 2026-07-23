import { Select } from '../../../../components/ui/Select/Select.js';
import type { DocumentFolderNode } from '../../types/document.types.js';
import { flattenFolders } from './folderOptions.js';

export function FolderPicker({
  folders,
  value,
  onChange,
  label = 'Složka',
  includeAll = false,
}: {
  folders: readonly DocumentFolderNode[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  includeAll?: boolean;
}) {
  return (
    <Select
      label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {includeAll ? (
        <option value="">Všechny složky</option>
      ) : (
        <option value="root">Kořen knihovny</option>
      )}
      {flattenFolders(folders).map((folder) => (
        <option
          key={folder.id}
          value={folder.id}
        >{`${'— '.repeat(folder.depth)}${folder.label}`}</option>
      ))}
    </Select>
  );
}
