import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { TravelPlan } from '../calendar/types/calendar.types.js';
import { PlaceAutocomplete } from './components/PlaceAutocomplete.js';
import { DefaultPlaceAutocomplete } from './components/DefaultPlaceAutocomplete.js';
import { RouteEstimateSummary } from './components/RouteEstimateSummary.js';
import {
  CALENDAR_PREFERENCES_CACHE_KEY,
  readCalendarPreferencesCache,
  writeCalendarPreferenceCache,
} from './lib/calendarPreferencesCache.js';

const suggestion = {
  providerPlaceId: null,
  primaryLabel: 'Městská knihovna',
  secondaryLabel: 'Praha 1',
  formattedAddress: 'Městská knihovna, Praha 1',
  latitude: 50.087,
  longitude: 14.42,
  placeType: 'poi',
};

function response(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  );
}

function wrapper(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

function readyPlan(patch: Partial<TravelPlan> = {}): TravelPlan {
  return {
    id: '10000000-0000-4000-8000-000000000001',
    eventId: '20000000-0000-4000-8000-000000000002',
    travelerUserId: '30000000-0000-4000-8000-000000000003',
    originMode: 'DEFAULT_PLACE',
    originPlaceId: null,
    previousEventId: null,
    routeMode: 'CAR_FAST_TRAFFIC',
    avoidTolls: false,
    avoidHighways: false,
    travelBufferMinutes: 10,
    distanceMeters: 12_500,
    durationSeconds: 2_100,
    departureAt: '2026-07-16T08:15:00.000Z',
    status: 'READY',
    conflict: {
      hasConflict: false,
      availableTransferSeconds: null,
      requiredTransferSeconds: 2_700,
      missingSeconds: 0,
    },
    ...patch,
  };
}

describe('place autocomplete', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('does not request suggestions below the minimum query length', async () => {
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'ab');
    await new Promise((resolve) => window.setTimeout(resolve, 400));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('debounces suggest requests', async () => {
    vi.mocked(fetch).mockImplementation(() => response({ items: [] }));
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    expect(fetch).not.toHaveBeenCalled();
    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1), {
      timeout: 1_000,
    });
  });

  it('aborts an obsolete suggestion request', async () => {
    const signals: AbortSignal[] = [];
    vi.mocked(fetch).mockImplementation((_input, init) => {
      const signal = init?.signal;
      if (signal) signals.push(signal);
      if (signals.length === 1)
        return new Promise<Response>((_resolve, reject) =>
          signal?.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          ),
        );
      return response({ items: [] });
    });
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'Pra');
    await waitFor(() => expect(signals).toHaveLength(1), { timeout: 1_000 });
    await userEvent.clear(input);
    await userEvent.type(input, 'Brno');
    await waitFor(() => expect(signals.length).toBeGreaterThan(1), {
      timeout: 1_000,
    });
    expect(signals[0]?.aborted).toBe(true);
  });

  it('does not select the first result without user confirmation', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      response({ items: [suggestion] }),
    );
    const onChange = vi.fn();
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    await screen.findByRole('option');
    expect(screen.getByRole('combobox')).not.toHaveAttribute(
      'aria-activedescendant',
    );
    expect(onChange.mock.calls.at(-1)?.[0]).toMatchObject({
      placeId: null,
      manual: true,
    });
  });

  it('supports arrow and Enter selection and saves a structured place', async () => {
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      if ((init?.method ?? 'GET') === 'POST')
        return response({
          id: '40000000-0000-4000-8000-000000000004',
          label: suggestion.primaryLabel,
          formattedAddress: suggestion.formattedAddress,
          visibility: 'PRIVATE',
          provider: 'MAPY',
          hasCoordinates: true,
          placeType: 'poi',
        });
      if (url.includes('/locations/suggest'))
        return response({ items: [suggestion] });
      return response({}, 404);
    });
    const onChange = vi.fn();
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={onChange}
      />,
    );
    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'Praha');
    await screen.findByRole('option');
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() =>
      expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
        placeId: '40000000-0000-4000-8000-000000000004',
        label: 'Městská knihovna',
        manual: false,
      }),
    );
  });

  it('closes the suggestion list with Escape', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      response({ items: [suggestion] }),
    );
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    await screen.findByRole('option');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });

  it('keeps manual text usable when routing is unavailable', async () => {
    const onChange = vi.fn();
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={onChange}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Chata');
    expect(onChange.mock.calls.at(-1)?.[0]).toEqual({
      placeId: null,
      label: 'Chata',
      manual: true,
    });
    expect(screen.getByText(/odhad cesty ale vyžaduje/)).toBeInTheDocument();
  });

  it('shows a safe fallback when suggestion loading fails', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      response({ message: 'secret' }, 503),
    );
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    expect(
      await screen.findByText(
        'Místa se nyní nepodařilo načíst. Text můžete uložit ručně bez výpočtu cesty.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('secret')).not.toBeInTheDocument();
  });

  it('shows required Mapy attribution with provider suggestions', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      response({ items: [suggestion] }),
    );
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    await screen.findByRole('option');
    expect(
      screen.getByLabelText('Vyhledávání poskytují Mapy.com'),
    ).toBeInTheDocument();
  });

  it('configures a default place through autocomplete instead of an empty select', async () => {
    const requests: { url: string; method: string; body: string | null }[] = [];
    vi.mocked(fetch).mockImplementation((input, init) => {
      const url =
        typeof input === 'string'
          ? input
          : input instanceof URL
            ? input.href
            : input.url;
      const method = init?.method ?? 'GET';
      requests.push({
        url,
        method,
        body: typeof init?.body === 'string' ? init.body : null,
      });
      if (url.includes('/calendar/preferences') && method === 'GET')
        return response({
          defaultPlaceId: null,
          defaultRouteMode: 'CAR_FAST_TRAFFIC',
          defaultTravelBufferMinutes: 10,
          avoidTolls: false,
          avoidHighways: false,
          compactCalendarView: 'AGENDA',
          mediumCalendarView: 'MONTH',
          expandedCalendarView: 'WEEK',
          showTravelBlocks: true,
          lastWorkShiftParticipantUserId: null,
        });
      if (url.includes('/locations/places') && method === 'GET')
        return response({ items: [] });
      if (url.includes('/locations/suggest'))
        return response({ items: [suggestion] });
      if (url.includes('/locations/places') && method === 'POST')
        return response({
          id: '40000000-0000-4000-8000-000000000004',
          label: suggestion.primaryLabel,
          formattedAddress: suggestion.formattedAddress,
          visibility: 'PRIVATE',
          provider: 'MAPY',
          routable: true,
          placeType: suggestion.placeType,
        });
      if (url.includes('/calendar/preferences') && method === 'PATCH')
        return response({
          defaultPlaceId: '40000000-0000-4000-8000-000000000004',
        });
      return response({}, 404);
    });
    wrapper(<DefaultPlaceAutocomplete />);
    expect(
      screen.queryByRole('combobox', { name: /uložené místo/i }),
    ).not.toBeInTheDocument();
    await userEvent.type(
      await screen.findByRole('combobox', { name: 'Výchozí místo' }),
      'Praha',
    );
    await userEvent.click(await screen.findByRole('option'));
    await userEvent.click(
      screen.getByRole('button', { name: 'Uložit jako výchozí' }),
    );
    await waitFor(() =>
      expect(
        requests.some(
          ({ url, method, body }) =>
            url.includes('/calendar/preferences') &&
            method === 'PATCH' &&
            body?.includes('40000000-0000-4000-8000-000000000004'),
        ),
      ).toBe(true),
    );
  });

  it('shows a dedicated state when Mapy.com is not configured', async () => {
    vi.mocked(fetch).mockImplementation(() =>
      response(
        {
          statusCode: 503,
          code: 'LOCATION_PROVIDER_NOT_CONFIGURED',
          message: 'internal provider message',
        },
        503,
      ),
    );
    wrapper(
      <PlaceAutocomplete
        value={{ placeId: null, label: '', manual: true }}
        onChange={() => undefined}
      />,
    );
    await userEvent.type(screen.getByRole('combobox'), 'Praha');
    expect(
      await screen.findByText(/Mapy.com nejsou na serveru nakonfigurované/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('internal provider message'),
    ).not.toBeInTheDocument();
  });
});

describe('route summary and preference cache', () => {
  beforeEach(() => localStorage.clear());

  it('renders provider distance, duration and server departure time', () => {
    wrapper(<RouteEstimateSummary plan={readyPlan()} />);
    expect(screen.getByText('Přibližně 35 min')).toBeInTheDocument();
    expect(screen.getByText(/12,5 km/)).toBeInTheDocument();
    expect(screen.getByText(/Doporučený odjezd 10:15/)).toBeInTheDocument();
    expect(
      screen.getByLabelText('Odhad trasy poskytují Mapy.com'),
    ).toBeInTheDocument();
  });

  it('communicates a transfer conflict with text and an alert role', () => {
    wrapper(
      <RouteEstimateSummary
        plan={readyPlan({
          conflict: {
            hasConflict: true,
            availableTransferSeconds: 1_200,
            requiredTransferSeconds: 2_100,
            missingSeconds: 900,
          },
        })}
      />,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Na přesun chybí přibližně 15 minut.',
    );
  });

  it('shows a retry-friendly message for an unavailable route', () => {
    wrapper(
      <RouteEstimateSummary plan={readyPlan({ status: 'UNAVAILABLE' })} />,
    );
    expect(
      screen.getByText('Odhad cesty se nepodařilo vypočítat.'),
    ).toBeInTheDocument();
  });

  it('stores compact and expanded view independently', () => {
    writeCalendarPreferenceCache('compact', 'AGENDA');
    writeCalendarPreferenceCache('expanded', 'WEEK');
    expect(readCalendarPreferencesCache()).toEqual({
      compact: 'AGENDA',
      expanded: 'WEEK',
    });
  });

  it('stores only namespaced view values without location data', () => {
    writeCalendarPreferenceCache('medium', 'DAY');
    const serialized = localStorage.getItem(CALENDAR_PREFERENCES_CACHE_KEY);
    expect(serialized).toBe('{"medium":"DAY"}');
    expect(serialized).not.toMatch(/address|latitude|longitude|token/i);
    expect(localStorage).toHaveLength(1);
  });

  it('ignores an invalid cached view safely', () => {
    localStorage.setItem(
      CALENDAR_PREFERENCES_CACHE_KEY,
      JSON.stringify({ compact: 'SECRET', expanded: 'MONTH' }),
    );
    expect(readCalendarPreferencesCache()).toEqual({ expanded: 'MONTH' });
  });
});
