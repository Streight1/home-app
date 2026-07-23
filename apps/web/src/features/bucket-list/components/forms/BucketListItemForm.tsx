import { useMemo, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import type { HouseholdMemberSummary } from '../../../household/household.public.js';
import type {
  BucketListItem,
  BucketListItemInput,
} from '../../types/bucket-list.types.js';
import { BucketListDocumentPicker } from './BucketListDocumentPicker.js';
import { BucketListItemFields } from './BucketListItemFields.js';
import { BucketListParticipantPicker } from './BucketListParticipantPicker.js';
import {
  bucketListItemInput,
  initialBucketListItemValues,
} from './bucketListItemFormValues.js';

export function BucketListItemForm({
  item,
  currentUserId,
  members,
  loading,
  error,
  onSubmit,
  onCancel,
  onDirtyChange,
}: {
  item?: BucketListItem;
  currentUserId?: string;
  members: HouseholdMemberSummary[];
  loading: boolean;
  error?: string | null;
  onSubmit: (input: BucketListItemInput) => void;
  onCancel: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const initial = useMemo(
    () => initialBucketListItemValues(item, currentUserId),
    [item, currentUserId],
  );
  const [values, setValues] = useState(initial);
  const [titleError, setTitleError] = useState<string>();
  const update = (patch: Partial<typeof values>) => {
    setValues((current) => ({ ...current, ...patch }));
    onDirtyChange(true);
  };
  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (!values.title.trim()) {
          setTitleError('Zadejte název položky.');
          return;
        }
        setTitleError(undefined);
        onSubmit(bucketListItemInput(values));
      }}
    >
      {error ? <InlineAlert variant="danger">{error}</InlineAlert> : null}
      <section aria-labelledby="bucket-list-basic-heading">
        <h3
          id="bucket-list-basic-heading"
          className="mb-4 text-section-title font-semibold"
        >
          Základní údaje
        </h3>
        <BucketListItemFields
          values={values}
          {...(titleError ? { titleError } : {})}
          onChange={update}
        />
      </section>
      <section
        className="border-t border-border pt-5"
        aria-labelledby="bucket-list-participants-heading"
      >
        <h3 id="bucket-list-participants-heading" className="sr-only">
          Účastníci
        </h3>
        <BucketListParticipantPicker
          members={members}
          selected={values.participantUserIds}
          onChange={(participantUserIds) => update({ participantUserIds })}
        />
      </section>
      <section
        className="border-t border-border pt-5"
        aria-labelledby="bucket-list-documents-heading"
      >
        <h3 id="bucket-list-documents-heading" className="sr-only">
          Dokumenty
        </h3>
        <BucketListDocumentPicker
          selected={values.documentIds}
          onChange={(documentIds) => update({ documentIds })}
        />
      </section>
      <div className="sticky bottom-0 -mx-1 flex flex-col-reverse gap-2 border-t border-border bg-surface-raised px-1 pt-4 sm:flex-row sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Zrušit
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {item ? 'Uložit změny' : 'Přidat položku'}
        </Button>
      </div>
    </form>
  );
}
