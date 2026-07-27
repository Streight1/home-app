import { Button } from '../../../components/ui/Button/Button.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Select } from '../../../components/ui/Select/Select.js';
import {
  useCalendarPreferences,
  useUpdateCalendarPreferences,
} from '../hooks/useCalendarPreferences.js';
import { DefaultPlaceAutocomplete } from './DefaultPlaceAutocomplete.js';
import type {
  CalendarViewPreference,
  RouteMode,
} from '../types/location.types.js';

const views: { value: CalendarViewPreference; label: string }[] = [
  { value: 'MONTH', label: 'Měsíc' },
  { value: 'WEEK', label: 'Týden' },
  { value: 'DAY', label: 'Den' },
  { value: 'AGENDA', label: 'Seznam' },
];
export function CalendarPreferencesPanel() {
  const preferences = useCalendarPreferences();
  const update = useUpdateCalendarPreferences();
  const value = preferences.data;
  if (!value)
    return (
      <section className="rounded-lg border border-border bg-surface-raised p-5">
        <h2 className="text-section-title font-semibold">
          Kalendář a cestování
        </h2>
        <p className="mt-2 text-body-sm text-text-muted">
          Načítáme preference…
        </p>
      </section>
    );
  const patch = (next: Parameters<typeof update.mutate>[0]) =>
    update.mutate(next);
  return (
    <section
      className="grid gap-4 rounded-lg border border-border bg-surface-raised p-5"
      aria-labelledby="calendar-preferences-title"
    >
      <div>
        <h2
          id="calendar-preferences-title"
          className="text-section-title font-semibold"
        >
          Kalendář a cestování
        </h2>
        <p className="mt-1 text-body-sm text-text-muted">
          Pohledy se ukládají samostatně pro telefon, tablet a desktop.
        </p>
      </div>
      {update.isError ? (
        <InlineAlert variant="warning">
          Preference se nepodařilo uložit.
        </InlineAlert>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(['compact', 'medium', 'expanded'] as const).map((layout) => {
          const key = `${layout}CalendarView` as const;
          return (
            <Select
              key={layout}
              label={
                layout === 'compact'
                  ? 'Telefon'
                  : layout === 'medium'
                    ? 'Tablet'
                    : 'Desktop'
              }
              value={value[key]}
              onChange={(event) =>
                patch({ [key]: event.target.value as CalendarViewPreference })
              }
            >
              {views.map((view) => (
                <option key={view.value} value={view.value}>
                  {view.label}
                </option>
              ))}
            </Select>
          );
        })}
        <Select
          label="Výchozí způsob cesty"
          value={value.defaultRouteMode}
          onChange={(event) =>
            patch({ defaultRouteMode: event.target.value as RouteMode })
          }
        >
          <option value="CAR_FAST_TRAFFIC">Autem s provozem</option>
          <option value="CAR_FAST">Autem nejrychleji</option>
          <option value="CAR_SHORT">Autem nejkratší</option>
          <option value="FOOT_FAST">Pěšky</option>
          <option value="BICYCLE_ROAD">Silniční kolo</option>
          <option value="BICYCLE_MOUNTAIN">Horské kolo</option>
        </Select>
      </div>
      <DefaultPlaceAutocomplete />
      <label className="flex min-h-11 items-center gap-3 text-body-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          checked={value.showTravelBlocks}
          onChange={(event) =>
            patch({ showTravelBlocks: event.target.checked })
          }
        />
        Zobrazovat cestovní bloky v kalendáři
      </label>
      <label className="flex min-h-11 items-center gap-3 text-body-sm">
        <input
          type="checkbox"
          className="size-5 accent-primary"
          checked={value.showTravelBlocksInMonth}
          onChange={(event) =>
            patch({ showTravelBlocksInMonth: event.target.checked })
          }
        />
        Zobrazovat cestovní bloky v měsíčním pohledu
      </label>
      <Button className="w-fit" disabled={!update.isPending}>
        {' '}
        {update.isPending
          ? 'Ukládáme…'
          : 'Preference jsou uložené automaticky'}{' '}
      </Button>
    </section>
  );
}
