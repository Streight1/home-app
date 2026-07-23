import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../components/ui/Spinner/Spinner.js';
import { ExtractionReviewPanel } from '../components/extraction/ExtractionReviewPanel.js';
import { DocumentPreview } from '../components/preview/DocumentPreview.js';
import { useDocument } from '../hooks/useDocument.js';
import {
  useAcceptSafeExtractionFields,
  useExtractionJob,
  useReviewExtractionField,
  useStartExtraction,
} from '../hooks/useDocumentExtraction.js';
import { useDocumentTypes } from '../hooks/useDocumentTypes.js';
import { documentErrorMessage } from '../lib/documentErrorMessage.js';
import type { HouseholdRole } from '../types/document.types.js';

export function DocumentExtractionPage({
  role,
  documentId,
}: {
  role: HouseholdRole;
  documentId: string;
}) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [mobileSection, setMobileSection] = useState<'preview' | 'fields'>(
    'fields',
  );
  const document = useDocument(documentId);
  const types = useDocumentTypes();
  const start = useStartExtraction(documentId);
  const job = useExtractionJob(documentId, jobId);
  const review = useReviewExtractionField(documentId, jobId ?? '');
  const acceptSafe = useAcceptSafeExtractionFields(documentId, jobId ?? '');
  const canMutate = role !== 'VIEWER';
  const begin = () =>
    start.mutate(undefined, {
      onSuccess: (created) => {
        setJobId(created.id);
        setMobileSection('fields');
      },
    });

  if (document.isPending || types.isPending) {
    return (
      <div className="grid min-h-64 place-items-center" role="status">
        <span className="flex items-center gap-3 text-body-sm text-text-muted">
          <Spinner /> Načítáme kontrolu vytěžení…
        </span>
      </div>
    );
  }
  if (document.isError || types.isError) {
    return (
      <InlineAlert variant="danger">
        {documentErrorMessage(document.error ?? types.error)}
      </InlineAlert>
    );
  }
  const item = document.data;
  const definition = types.data.items.find((type) => type.key === item.type);
  const error = start.error ?? job.error ?? review.error ?? acceptSafe.error;
  return (
    <div>
      <header className="mb-5">
        <WorkspaceLink
          view={{ area: 'documents', screen: 'detail', documentId: item.id }}
          className="inline-flex min-h-11 items-center gap-2 rounded-md text-body-sm font-medium text-text-muted hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Zpět na detail
        </WorkspaceLink>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-caption font-semibold uppercase tracking-wide text-primary-emphasis">
              Kontrola návrhů
            </p>
            <h1 className="mt-1 text-page-title font-semibold text-text">
              Vytěžení dat
            </h1>
            <p className="mt-2 break-words text-body-sm text-text-muted">
              {item.title}
            </p>
          </div>
          {canMutate ? (
            <Button
              variant={jobId ? 'secondary' : 'primary'}
              loading={start.isPending}
              onClick={begin}
            >
              {jobId ? (
                <RefreshCw className="size-4" aria-hidden="true" />
              ) : (
                <Sparkles className="size-4" aria-hidden="true" />
              )}
              {jobId ? 'Spustit znovu' : 'Spustit vytěžení'}
            </Button>
          ) : null}
        </div>
      </header>
      {error ? (
        <div className="mb-4">
          <InlineAlert variant="danger">
            {documentErrorMessage(error)}
          </InlineAlert>
        </div>
      ) : null}
      {!jobId ? (
        <InlineAlert variant="info" title="Vytěžená data jsou pouze návrhy">
          PDF musí obsahovat textovou vrstvu. OCR obrázků v této instalaci není
          nakonfigurováno. Ručně potvrzená metadata se automaticky nepřepisují.
        </InlineAlert>
      ) : null}
      <div
        className="mb-4 grid grid-cols-2 gap-2 lg:hidden"
        role="group"
        aria-label="Část kontroly"
      >
        <Button
          variant={mobileSection === 'preview' ? 'primary' : 'secondary'}
          aria-pressed={mobileSection === 'preview'}
          onClick={() => setMobileSection('preview')}
        >
          Náhled
        </Button>
        <Button
          variant={mobileSection === 'fields' ? 'primary' : 'secondary'}
          aria-pressed={mobileSection === 'fields'}
          onClick={() => setMobileSection('fields')}
        >
          Pole
        </Button>
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.8fr)]">
        <section
          className={mobileSection === 'preview' ? 'block' : 'hidden lg:block'}
          aria-label="Náhled dokumentu"
        >
          <DocumentPreview document={item} />
        </section>
        <div
          className={mobileSection === 'fields' ? 'block' : 'hidden lg:block'}
        >
          {jobId && job.data ? (
            <ExtractionReviewPanel
              job={job.data}
              definition={definition}
              canMutate={canMutate}
              busy={review.isPending || acceptSafe.isPending}
              confirmedMetadata={item.metadata}
              onReview={(candidateId, status, value) =>
                review.mutate({
                  candidateId,
                  status,
                  ...(value !== undefined ? { value } : {}),
                })
              }
              onAcceptSafe={() => acceptSafe.mutate()}
            />
          ) : jobId && job.isPending ? (
            <div className="grid min-h-64 place-items-center" role="status">
              <Spinner />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
