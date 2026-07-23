import { useState, type SyntheticEvent } from 'react';
import { WorkspaceLink } from '../../../app/workspace-navigation/WorkspaceLink.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { DocumentBaseFields } from './forms/DocumentBaseFields.js';
import { DocumentFilePicker } from './forms/DocumentFilePicker.js';
import { DocumentMetadataFields } from './forms/DocumentMetadataFields.js';
import { DocumentNotesField } from './forms/DocumentNotesField.js';
import { DocumentTypeSelector } from './forms/DocumentTypeSelector.js';
import {
  titleFromFilename,
  validateDocumentFile,
  validateDocumentMetadata,
  validateDocumentTitle,
} from '../schemas/documentForm.schema.js';
import type {
  CreateDocumentInput,
  DocumentFolderNode,
  DocumentMetadata,
  DocumentTypeDefinition,
  DocumentTypeKey,
  MetadataValue,
} from '../types/document.types.js';

interface DocumentUploadFormProps {
  folders?: readonly DocumentFolderNode[];
  types?: readonly DocumentTypeDefinition[];
  submitting: boolean;
  serverError?: string | null;
  onSubmit: (input: CreateDocumentInput) => void;
}

export function DocumentUploadForm({
  folders = [],
  types = [],
  submitting,
  serverError = null,
  onSubmit,
}: DocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [documentType, setDocumentType] = useState<DocumentTypeKey>('GENERAL');
  const [folderId, setFolderId] = useState('root');
  const [documentDate, setDocumentDate] = useState('');
  const [metadata, setMetadata] = useState<DocumentMetadata>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [metadataErrors, setMetadataErrors] = useState<Record<string, string>>(
    {},
  );
  const definition = types.find((type) => type.key === documentType);

  const selectFile = async (selected: File | undefined) => {
    if (!selected) return;
    const validationError = await validateDocumentFile(selected);
    setFileError(validationError);
    if (validationError) {
      setFile(null);
      return;
    }
    setFile(selected);
    if (!title.trim()) setTitle(titleFromFilename(selected.name));
  };

  const changeMetadata = (key: string, value: MetadataValue | undefined) => {
    setMetadata((current) =>
      value === undefined
        ? Object.fromEntries(
            Object.entries(current).filter(
              ([currentKey]) => currentKey !== key,
            ),
          )
        : { ...current, [key]: value },
    );
    setMetadataErrors((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([currentKey]) => currentKey !== key),
      ),
    );
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextTitleError = validateDocumentTitle(title) ?? undefined;
    const nextMetadataErrors = validateDocumentMetadata(definition, metadata);
    setTitleError(nextTitleError);
    setMetadataErrors(nextMetadataErrors);
    if (!file) setFileError('Vyberte soubor, který chcete nahrát.');
    if (nextTitleError || !file || Object.keys(nextMetadataErrors).length > 0)
      return;
    onSubmit({
      title: title.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(notes ? { notes } : {}),
      documentType,
      ...(folderId !== 'root' ? { folderId } : {}),
      metadata,
      ...(documentDate ? { documentDate } : {}),
      file,
    });
  };

  return (
    <form onSubmit={submit} className="grid gap-5" noValidate>
      {serverError ? (
        <InlineAlert variant="danger">{serverError}</InlineAlert>
      ) : null}
      <Card className="p-5 md:p-6">
        <h2 className="text-section-title font-semibold text-text">Soubor</h2>
        <p className="mb-5 mt-1 text-body-sm text-text-muted">
          PDF, JPEG, PNG, TXT, DOCX nebo XLSX. Soubor nepoužíváme jako veřejnou
          adresu.
        </p>
        <DocumentFilePicker
          file={file}
          error={fileError}
          disabled={submitting}
          onSelect={(selected) => void selectFile(selected)}
          onRemove={() => {
            setFile(null);
            setFileError(null);
          }}
        />
      </Card>

      <Card className="grid gap-5 p-5 md:p-6">
        <h2 className="text-section-title font-semibold text-text">
          Základní údaje
        </h2>
        <DocumentBaseFields
          title={title}
          description={description}
          documentDate={documentDate}
          folderId={folderId}
          folders={folders}
          {...(titleError ? { titleError } : {})}
          disabled={submitting}
          onTitle={(value) => {
            setTitle(value);
            setTitleError(undefined);
          }}
          onDescription={setDescription}
          onDate={setDocumentDate}
          onFolder={setFolderId}
        />
        <DocumentNotesField
          value={notes}
          disabled={submitting}
          onChange={setNotes}
        />
      </Card>

      <Card className="grid gap-5 p-5 md:p-6">
        <div>
          <h2 className="text-section-title font-semibold text-text">
            Typ a metadata
          </h2>
          <p className="mt-1 text-body-sm text-text-muted">
            Vyberte typ a doplňte jen údaje, které bezpečně znáte.
          </p>
        </div>
        <DocumentTypeSelector
          types={types}
          value={documentType}
          disabled={submitting}
          onChange={(value) => {
            setDocumentType(value);
            setMetadata({});
            setMetadataErrors({});
          }}
        />
        <DocumentMetadataFields
          definition={definition}
          values={metadata}
          errors={metadataErrors}
          disabled={submitting}
          onChange={changeMetadata}
        />
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <WorkspaceLink
          view={{ area: 'documents', screen: 'list' }}
          className="inline-flex min-h-11 items-center justify-center rounded-md border border-border-strong bg-surface-raised px-4 text-body-sm font-medium text-text hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
        >
          Zrušit
        </WorkspaceLink>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitting ? 'Nahráváme…' : 'Uložit dokument'}
        </Button>
      </div>
    </form>
  );
}
