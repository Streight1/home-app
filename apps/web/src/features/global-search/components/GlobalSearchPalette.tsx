import { Search } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { parseWorkspaceState } from '../../../app/workspace-navigation/workspace-storage.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { Dialog } from '../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../components/ui/Spinner/Spinner.js';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser.js';
import { useApplicationSearch } from '../hooks/useApplicationSearch.js';
import { useSearchCommands } from '../hooks/useSearchCommands.js';
import {
  readRecentSearchItems,
  storeRecentSearchItem,
} from '../storage/recentSearchItems.js';
import {
  searchFilterTypes,
  type ApplicationSearchResult,
  type RecentSearchItem,
  type SearchFilterKey,
} from '../types/search.types.js';
import { SearchCommandList } from './SearchCommandList.js';
import { SearchFilters } from './SearchFilters.js';
import { SearchRecentList } from './SearchRecentList.js';
import { SearchResultList } from './SearchResultList.js';

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement ||
    target instanceof HTMLSelectElement ||
    target.isContentEditable
  );
}

export function useGlobalSearchShortcut(onOpen: () => void) {
  useEffect(() => {
    const listener = (event: globalThis.KeyboardEvent) => {
      if (
        event.key.toLocaleLowerCase('en') !== 'k' ||
        (!event.ctrlKey && !event.metaKey) ||
        event.altKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      )
        return;
      event.preventDefault();
      onOpen();
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [onOpen]);
}

export function GlobalSearchPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const workspace = useWorkspaceNavigation();
  const auth = useCurrentUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<SearchFilterKey>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const userId = auth.data?.user.id;
  const role = auth.data?.activeHousehold.role;
  const [recent, setRecent] = useState<RecentSearchItem[]>([]);
  const search = useApplicationSearch(query, searchFilterTypes[filter], open);

  const close = () => onOpenChange(false);
  const runAndClose = (run: () => void) => {
    close();
    run();
  };
  const commands = useSearchCommands(role);

  const hasQuery = query.trim().length > 0;
  const results = search.data?.groups.flatMap((group) => group.items) ?? [];
  const optionIds = hasQuery
    ? results.map((result) => result.resultId)
    : [
        ...commands.map((command) => command.id),
        ...recent.map((_, index) => `recent-${String(index)}`),
      ];
  const activeId =
    optionIds[Math.min(activeIndex, Math.max(0, optionIds.length - 1))];

  useEffect(() => setActiveIndex(0), [query, filter]);
  useEffect(() => {
    if (open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      if (userId) setRecent(readRecentSearchItems(userId));
      window.setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    setQuery('');
    setFilter('all');
    window.setTimeout(() => returnFocusRef.current?.focus(), 0);
  }, [open, userId]);

  const openRecent = (item: RecentSearchItem) =>
    runAndClose(() => workspace.navigate(item.navigationTarget));
  const openResult = (result: ApplicationSearchResult) => {
    const state = parseWorkspaceState({ view: result.navigationTarget });
    if (!state) return;
    if (userId && result.providerKey !== 'finance')
      setRecent(
        storeRecentSearchItem(userId, {
          providerKey: result.providerKey,
          entityKind: result.entityKind,
          title: result.title,
          navigationTarget: state.view,
          openedAt: new Date().toISOString(),
        }),
      );
    runAndClose(() => workspace.navigate(state.view));
  };
  const activateCurrent = () => {
    if (!activeId) return;
    if (hasQuery) {
      const result = results.find((item) => item.resultId === activeId);
      if (result) openResult(result);
      return;
    }
    const command = commands.find((item) => item.id === activeId);
    if (command) runAndClose(command.run);
    else {
      const index = Number(activeId.replace('recent-', ''));
      const item = recent[index];
      if (item) openRecent(item);
    }
  };
  const onInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActiveIndex((current) => {
        if (optionIds.length === 0) return 0;
        return (current + direction + optionIds.length) % optionIds.length;
      });
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      activateCurrent();
    }
  };

  const resultCount = results.length;
  const hasOptions = hasQuery
    ? results.length > 0 && !search.isLoading && !search.error
    : optionIds.length > 0;
  const statusMessage = search.isLoading
    ? 'Probíhá hledání.'
    : search.error
      ? 'Hledání skončilo chybou.'
      : `${String(resultCount)} dostupných výsledků.`;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Hledat v aplikaci"
      description="Výsledky respektují vaše oprávnění v domácnosti. Dotaz se neukládá do historie."
      size="lg"
      mobileFullScreen
    >
      <div className="grid max-h-[calc(100dvh-10rem)] gap-4 overflow-hidden">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-3.5 size-5 text-text-muted"
            aria-hidden="true"
          />
          <label htmlFor="global-search-input" className="sr-only">
            Hledat v aplikaci
          </label>
          <input
            ref={inputRef}
            id="global-search-input"
            role="combobox"
            aria-autocomplete="list"
            aria-controls="global-search-results"
            aria-expanded={open}
            aria-activedescendant={
              activeId ? `search-option-${activeId}` : undefined
            }
            value={query}
            placeholder="Název, klíčové slovo nebo místo…"
            className="min-h-12 w-full rounded-lg border border-border bg-input pl-11 pr-4 text-body-sm text-text placeholder:text-text-subtle focus-visible:border-focus focus-visible:outline-2 focus-visible:outline-focus"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
        </div>
        <SearchFilters selected={filter} onSelect={setFilter} />
        <p className="sr-only" aria-live="polite">
          {statusMessage}
        </p>
        {hasQuery && search.data?.partial ? (
          <div className="mb-4">
            <InlineAlert variant="warning">
              Některé oblasti dočasně neodpověděly. Ostatní výsledky jsou
              dostupné.
            </InlineAlert>
          </div>
        ) : null}
        <div
          id="global-search-results"
          role={hasOptions ? 'listbox' : 'region'}
          aria-label={
            hasQuery ? 'Výsledky hledání' : 'Příkazy a nedávné položky'
          }
          className="min-h-0 overflow-y-auto pr-1"
        >
          {!hasQuery ? (
            <div className="grid gap-5" role="presentation">
              <SearchCommandList
                commands={commands}
                {...(activeId ? { activeId } : {})}
                onRun={(command) => runAndClose(command.run)}
              />
              <SearchRecentList
                items={recent}
                {...(activeId ? { activeId } : {})}
                onOpen={openRecent}
              />
            </div>
          ) : query.trim().length < 2 ? (
            <p className="rounded-md bg-surface-subtle p-4 text-body-sm text-text-muted">
              Zadejte alespoň 2 znaky.
            </p>
          ) : search.isLoading ? (
            <div
              className="flex min-h-32 items-center justify-center gap-3"
              role="status"
            >
              <Spinner />
              <span className="text-body-sm text-text-muted">Hledáme…</span>
            </div>
          ) : search.error ? (
            <InlineAlert variant="danger">{search.error}</InlineAlert>
          ) : search.data?.groups.length ? (
            <SearchResultList
              response={search.data}
              {...(activeId ? { activeId } : {})}
              onOpen={openResult}
              onShowGroup={(groupKey) => {
                const target: Record<string, SearchFilterKey> = {
                  documents: 'documents',
                  tasks: 'tasks',
                  calendar: 'calendar',
                  finance: 'finance',
                  meals: 'meals',
                  expeditions: 'expeditions',
                  other: 'other',
                };
                setFilter(target[groupKey] ?? 'all');
              }}
            />
          ) : (
            <p className="rounded-md bg-surface-subtle p-4 text-body-sm text-text-muted">
              Pro tento dotaz nebyly nalezeny dostupné záznamy.
            </p>
          )}
        </div>
      </div>
    </Dialog>
  );
}
