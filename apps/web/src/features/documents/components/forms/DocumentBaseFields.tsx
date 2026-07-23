import { Input } from '../../../../components/ui/Input/Input.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import type { DocumentFolderNode } from '../../types/document.types.js';
import { FolderPicker } from '../folders/FolderPicker.js';

interface DocumentBaseFieldsProps {
  title: string;
  description: string;
  documentDate: string;
  folderId?: string;
  folders?: readonly DocumentFolderNode[];
  titleError?: string;
  disabled?: boolean;
  showFolder?: boolean;
  onTitle: (value: string) => void;
  onDescription: (value: string) => void;
  onDate: (value: string) => void;
  onFolder?: (value: string) => void;
}

export function DocumentBaseFields({
  title,
  description,
  documentDate,
  folderId = 'root',
  folders = [],
  titleError,
  disabled,
  showFolder = true,
  onTitle,
  onDescription,
  onDate,
  onFolder,
}: DocumentBaseFieldsProps) {
  return (
    <div className="grid gap-5">
      <Input
        label="Název dokumentu"
        value={title}
        {...(titleError ? { error: titleError } : {})}
        maxLength={200}
        required
        disabled={disabled}
        onChange={(event) => onTitle(event.target.value)}
      />
      <Textarea
        label="Krátký popis"
        value={description}
        maxLength={2_000}
        disabled={disabled}
        onChange={(event) => onDescription(event.target.value)}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Datum dokumentu"
          type="date"
          value={documentDate}
          disabled={disabled}
          onChange={(event) => onDate(event.target.value)}
        />
        {showFolder && onFolder ? (
          <FolderPicker
            folders={folders}
            value={folderId || 'root'}
            onChange={onFolder}
          />
        ) : null}
      </div>
    </div>
  );
}
