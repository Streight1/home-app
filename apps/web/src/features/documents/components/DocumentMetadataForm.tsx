import { useEffect, useMemo, useState, type SyntheticEvent } from 'react';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { DocumentBaseFields } from './forms/DocumentBaseFields.js';
import { DocumentMetadataFields } from './forms/DocumentMetadataFields.js';
import { DocumentNotesField } from './forms/DocumentNotesField.js';
import { DocumentTypeSelector } from './forms/DocumentTypeSelector.js';
import {
  validateDocumentMetadata,
  validateDocumentTitle,
} from '../schemas/documentForm.schema.js';
import type {
  DocumentItem,
  DocumentMetadata,
  DocumentTypeDefinition,
  DocumentTypeKey,
  MetadataValue,
  UpdateDocumentInput,
} from '../types/document.types.js';

interface DocumentMetadataFormProps {
  document: DocumentItem;
  types: readonly DocumentTypeDefinition[];
  submitting: boolean;
  error?: string | null;
  onCancel: () => void;
  onSubmit: (input: UpdateDocumentInput) => void;
  onDirtyChange?: (dirty: boolean) => void;
}

export function DocumentMetadataForm({
  document,
  types,
  submitting,
  error = null,
  onCancel,
  onSubmit,
  onDirtyChange,
}: DocumentMetadataFormProps) {
  const [title, setTitle] = useState(document.title);
  const [description, setDescription] = useState(document.description ?? '');
  const [notes, setNotes] = useState(document.notes ?? '');
  const [documentType, setDocumentType] = useState<DocumentTypeKey>(
    document.type,
  );
  const [documentDate, setDocumentDate] = useState(document.documentDate ?? '');
  const [metadata, setMetadata] = useState<DocumentMetadata>(document.metadata);
  const [titleError, setTitleError] = useState<string | undefined>();
  const [metadataErrors, setMetadataErrors] = useState<Record<string, string>>(
    {},
  );
  const definition = types.find((type) => type.key === documentType);
  const initialSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: document.title,
        description: document.description ?? '',
        notes: document.notes ?? '',
        documentType: document.type,
        documentDate: document.documentDate ?? '',
        metadata: document.metadata,
      }),
    [document],
  );
  const dirty =
    JSON.stringify({
      title,
      description,
      notes,
      documentType,
      documentDate,
      metadata,
    }) !== initialSnapshot;
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

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
  };

  const submit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitting) return;
    const nextTitleError = validateDocumentTitle(title) ?? undefined;
    const nextMetadataErrors = validateDocumentMetadata(definition, metadata);
    setTitleError(nextTitleError);
    setMetadataErrors(nextMetadataErrors);
    if (nextTitleError || Object.keys(nextMetadataErrors).length > 0) return;
    onSubmit({
      title: title.trim(),
      description: description.trim() || null,
      notes: notes || null,
      documentType,
      metadata,
      documentDate: documentDate || null,
    });
  };

  return (
    <form className="grid gap-5" onSubmit={submit} noValidate>
      {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
      <DocumentBaseFields
        title={title}
        description={description}
        documentDate={documentDate}
        {...(titleError ? { titleError } : {})}
        disabled={submitting}
        showFolder={false}
        onTitle={(value) => {
          setTitle(value);
          setTitleError(undefined);
        }}
        onDescription={setDescription}
        onDate={setDocumentDate}
      />
      <DocumentNotesField
        value={notes}
        disabled={submitting}
        onChange={setNotes}
      />
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
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button onClick={onCancel} disabled={submitting}>
          Zrušit
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          Uložit změny
        </Button>
      </div>
    </form>
  );
}
