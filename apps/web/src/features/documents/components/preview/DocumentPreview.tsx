import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../../components/ui/Spinner/Spinner.js';
import { documentErrorMessage } from '../../lib/documentErrorMessage.js';
import type { DocumentItem } from '../../types/document.types.js';
import { useDocumentPreview } from '../../hooks/useDocumentPreview.js';
import { ImagePreview } from './ImagePreview.js';
import { PdfPreview } from './PdfPreview.js';
import { TextPreview } from './TextPreview.js';
import { UnsupportedPreview } from './UnsupportedPreview.js';

const previewMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'text/plain',
]);

export function DocumentPreview({ document }: { document: DocumentItem }) {
  const mimeType = document.file?.mimeType ?? '';
  const supported = previewMimeTypes.has(mimeType);
  const preview = useDocumentPreview(document.id, supported);
  if (!document.file || !supported) return <UnsupportedPreview />;
  if (preview.loading) {
    return (
      <div className="grid min-h-80 place-items-center" role="status">
        <span className="flex items-center gap-3 text-body-sm text-text-muted">
          <Spinner /> Načítáme zabezpečený náhled…
        </span>
      </div>
    );
  }
  if (preview.error || !preview.objectUrl) {
    return (
      <InlineAlert variant="danger" title="Náhled nelze načíst">
        {documentErrorMessage(preview.error)}
      </InlineAlert>
    );
  }
  if (mimeType === 'application/pdf') {
    return <PdfPreview objectUrl={preview.objectUrl} title={document.title} />;
  }
  if (mimeType === 'text/plain') {
    return <TextPreview text={preview.text ?? ''} />;
  }
  return <ImagePreview objectUrl={preview.objectUrl} title={document.title} />;
}
