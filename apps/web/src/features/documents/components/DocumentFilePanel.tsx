import { Download, Eye, FileText, Sparkles } from 'lucide-react';
import { Button } from '../../../components/ui/Button/Button.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { formatDocumentType, formatFileSize } from '../lib/documentFormat.js';
import type { DocumentFile } from '../types/document.types.js';
import { useDocumentNavigation } from '../navigation/useDocumentNavigation.js';

interface DocumentFilePanelProps {
  file: DocumentFile;
  documentId: string;
  extractionAvailable: boolean;
  downloading: boolean;
  error?: string | null;
  onDownload: () => void;
}

export function DocumentFilePanel({
  file,
  documentId,
  extractionAvailable,
  downloading,
  error = null,
  onDownload,
}: DocumentFilePanelProps) {
  const navigation = useDocumentNavigation();
  return (
    <Card className="p-5 md:p-6">
      <h2 className="text-section-title font-semibold text-text">Soubor</h2>
      <div className="mt-4 flex items-start gap-3 rounded-lg border border-border bg-surface-subtle p-4">
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-primary-soft text-primary-emphasis">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="break-words text-body-sm font-semibold text-text">
            {file.originalFilename}
          </p>
          <p className="mt-1 text-caption text-text-muted">
            {formatDocumentType(file.mimeType)} ·{' '}
            {formatFileSize(file.sizeBytes)}
          </p>
        </div>
      </div>
      {error ? (
        <div className="mt-4">
          <InlineAlert variant="danger">{error}</InlineAlert>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="primary"
          onClick={() => navigation.openDocumentPreview(documentId)}
        >
          <Eye className="size-4" aria-hidden="true" /> Náhled
        </Button>
        <Button loading={downloading} onClick={onDownload}>
          <Download className="size-4" aria-hidden="true" />
          {downloading ? 'Připravujeme…' : 'Stáhnout'}
        </Button>
        {extractionAvailable ? (
          <Button onClick={() => navigation.openDocumentExtraction(documentId)}>
            <Sparkles className="size-4" aria-hidden="true" /> Vytěžit data
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
