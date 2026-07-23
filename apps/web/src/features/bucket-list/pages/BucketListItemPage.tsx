import {
  ArrowLeft,
  CalendarDays,
  Check,
  FileText,
  MapPin,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Avatar } from '../../../components/ui/Avatar/Avatar.js';
import { Badge } from '../../../components/ui/Badge/Badge.js';
import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import { BucketListActionDialog } from '../components/dialogs/BucketListActionDialog.js';
import { BucketListItemDialog } from '../components/dialogs/BucketListItemDialog.js';
import {
  useBucketListItem,
  useBucketListMutations,
} from '../hooks/useBucketList.js';
import {
  bucketListCategoryLabels,
  bucketListStatusLabels,
  formatBucketDate,
} from '../lib/bucketListLabels.js';

export function BucketListItemPage({ itemId }: { itemId: string }) {
  const workspace = useWorkspaceNavigation();
  const query = useBucketListItem(itemId);
  const mutations = useBucketListMutations();
  const [editing, setEditing] = useState(false);
  const [action, setAction] = useState<'complete' | 'skip' | 'delete' | null>(
    null,
  );
  if (query.isLoading)
    return <LoadingScreen embedded message="Načítáme přání…" />;
  if (!query.data)
    return (
      <InlineAlert variant="danger">Položku se nepodařilo načíst.</InlineAlert>
    );
  const item = query.data;
  return (
    <div className="grid gap-5">
      <Button
        variant="ghost"
        className="justify-self-start"
        onClick={() =>
          workspace.navigate({ area: 'bucket-list', screen: 'overview' })
        }
      >
        <ArrowLeft className="size-4" aria-hidden="true" /> Zpět na seznam
      </Button>
      <header className="aurora-header-surface rounded-lg border border-border p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">
                {bucketListCategoryLabels[item.category]}
              </Badge>
              <Badge
                variant={item.status === 'COMPLETED' ? 'success' : 'neutral'}
              >
                {bucketListStatusLabels[item.status]}
              </Badge>
            </div>
            <h1 className="mt-3 text-page-title font-semibold">{item.title}</h1>
            {item.description ? (
              <p className="mt-2 max-w-3xl whitespace-pre-wrap text-body-sm text-text-muted">
                {item.description}
              </p>
            ) : null}
          </div>
          {item.permissions.canEdit ? (
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setEditing(true)}>
                <Pencil className="size-4" aria-hidden="true" /> Upravit
              </Button>
              {item.permissions.canComplete ? (
                <Button variant="primary" onClick={() => setAction('complete')}>
                  <Check className="size-4" aria-hidden="true" /> Splnit
                </Button>
              ) : null}
              {item.permissions.canReopen || item.permissions.canRestore ? (
                <Button
                  onClick={() =>
                    mutations.lifecycle.mutate({
                      itemId,
                      action: item.permissions.canReopen ? 'reopen' : 'restore',
                    })
                  }
                >
                  <RotateCcw className="size-4" aria-hidden="true" /> Vrátit do
                  plánu
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </header>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <section className="rounded-lg border border-border bg-surface-raised p-5">
          <h2 className="text-section-title font-semibold">Podrobnosti</h2>
          <dl className="mt-4 grid gap-4 sm:grid-cols-2">
            <Detail
              icon={<CalendarDays className="size-4" />}
              label="Cílové datum"
              value={formatBucketDate(item.targetDate) ?? 'Bez data'}
            />
            <Detail
              icon={<MapPin className="size-4" />}
              label="Místo"
              value={item.location?.label ?? 'Bez místa'}
            />
          </dl>
          {item.notes ? (
            <div className="mt-5 border-t border-border pt-5">
              <h3 className="font-semibold">Poznámky</h3>
              <p className="mt-2 whitespace-pre-wrap text-body-sm text-text-muted">
                {item.notes}
              </p>
            </div>
          ) : null}
          {item.documents.length ? (
            <div className="mt-5 border-t border-border pt-5">
              <h3 className="font-semibold">Dokumenty</h3>
              <ul className="mt-2 grid gap-2">
                {item.documents.map((document) => (
                  <li key={document.id}>
                    <button
                      type="button"
                      className="flex min-h-11 w-full items-center gap-2 rounded-md px-3 text-left text-body-sm hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-focus"
                      onClick={() =>
                        workspace.openOverlay({
                          kind: 'document-preview',
                          documentId: document.id,
                        })
                      }
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      {document.primaryLabel}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
        <aside className="rounded-lg border border-border bg-surface-raised p-5">
          <h2 className="text-section-title font-semibold">Účastníci</h2>
          {item.participants.length ? (
            <ul className="mt-3 grid gap-3">
              {item.participants.map((participant) => (
                <li key={participant.id} className="flex items-center gap-3">
                  <Avatar
                    name={participant.displayName ?? participant.email}
                    imageUrl={participant.avatarUrl}
                    size="sm"
                  />
                  <span className="text-body-sm">
                    {participant.displayName ?? participant.email}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-body-sm text-text-muted">
              Položka nemá vybrané účastníky.
            </p>
          )}
          {item.completions.length ? (
            <div className="mt-5 border-t border-border pt-5">
              <h3 className="font-semibold">Historie splnění</h3>
              <ul className="mt-2 grid gap-3 text-body-sm">
                {item.completions.map((completion) => (
                  <li key={completion.id}>
                    <time dateTime={completion.completedAt}>
                      {new Date(completion.completedAt).toLocaleDateString(
                        'cs-CZ',
                      )}
                    </time>
                    {completion.note ? (
                      <p className="text-text-muted">{completion.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
      <BucketListItemDialog
        listId={item.bucketListId}
        item={item}
        open={editing}
        onOpenChange={setEditing}
      />
      <BucketListActionDialog
        item={item}
        action={action}
        onClose={() => setAction(null)}
      />
    </div>
  );
}

function Detail({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-caption text-text-muted">
        {icon} {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
