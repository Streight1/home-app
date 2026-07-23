import { FileQuestion } from 'lucide-react';
import { EmptyState } from '../../../../components/ui/EmptyState/EmptyState.js';

export function UnsupportedPreview() {
  return (
    <EmptyState
      eyebrow={
        <span className="mx-auto grid size-11 place-items-center rounded-md bg-primary-soft text-primary-emphasis">
          <FileQuestion className="size-6" aria-hidden="true" />
        </span>
      }
      title="Náhled tohoto formátu není dostupný"
      description="DOCX a XLSX lze bezpečně stáhnout. Převod Office dokumentů v této verzi neprovádíme."
    />
  );
}
