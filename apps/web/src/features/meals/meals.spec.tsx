import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseWorkspaceState } from '../../app/workspace-navigation/workspace-storage.js';
import { MealsDashboardWidget } from './components/dashboard/MealsDashboardWidget.js';
import { MealParticipantPicker } from './components/planner/MealParticipantPicker.js';
import { RecipeIngredientFields } from './components/recipes/RecipeIngredientFields.js';
import { scaleDecimalQuantity, UNIT_LABELS } from './lib/decimalQuantity.js';

const workspace = vi.hoisted(() => ({
  navigate: vi.fn(),
  openOverlay: vi.fn(),
  closeOverlay: vi.fn(),
  view: { area: 'dashboard' as const },
}));

vi.mock('../../app/workspace-navigation/useWorkspaceNavigation.js', () => ({
  useWorkspaceNavigation: () => workspace,
}));

function renderClient(element: ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>{element}</QueryClientProvider>,
  );
}

describe('meals UI and decimal behavior', () => {
  beforeEach(() => {
    workspace.navigate.mockReset();
    workspace.openOverlay.mockReset();
    vi.stubGlobal('fetch', vi.fn());
  });

  it('scales recipe quantities exactly for 2 → 4 and 4 → 3 portions', () => {
    expect(scaleDecimalQuantity('250', '2', '4')).toBe('500');
    expect(scaleDecimalQuantity('1.5', '4', '3')).toBe('1.125');
    expect(scaleDecimalQuantity(null, '2', '4')).toBeNull();
  });

  it('uses Czech labels for every supported unit', () => {
    expect(UNIT_LABELS.TBSP).toBe('lžíce');
    expect(UNIT_LABELS.AS_NEEDED).toBe('podle chuti');
    expect(UNIT_LABELS.PIECE).toBe('kus');
  });

  it('adds and reorders recipe ingredients with keyboard-accessible buttons', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <RecipeIngredientFields value={[]} onChange={onChange} />,
    );
    await user.click(screen.getByRole('button', { name: 'Přidat surovinu' }));
    expect(onChange).toHaveBeenCalledWith([
      { ingredientName: '', quantity: null, unit: 'G', isOptional: false },
    ]);
    rerender(
      <RecipeIngredientFields
        value={[
          {
            ingredientName: 'Mouka',
            quantity: '500',
            unit: 'G',
            isOptional: false,
          },
          {
            ingredientName: 'Voda',
            quantity: '1',
            unit: 'L',
            isOptional: false,
          },
        ]}
        onChange={onChange}
      />,
    );
    const moveUpButtons = screen.getAllByRole('button', {
      name: 'Posunout surovinu nahoru',
    });
    const secondMoveUp = moveUpButtons[1];
    expect(secondMoveUp).toBeDefined();
    if (!secondMoveUp) return;
    await user.click(secondMoveUp);
    expect(onChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ ingredientName: 'Voda' }),
      expect.objectContaining({ ingredientName: 'Mouka' }),
    ]);
  });

  it('renders participant names and allows multiple selections', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <MealParticipantPicker
        members={[
          { id: 'a', displayName: 'Adam', avatarUrl: null },
          { id: 'j', displayName: 'Jana', avatarUrl: null },
        ]}
        selected={['a']}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByLabelText('Jana'));
    expect(onChange).toHaveBeenCalledWith(['a', 'j']);
  });

  it('renders real dashboard data and opens central quick actions', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          today: '2026-07-29',
          todayMeals: [
            {
              id: 'meal-a',
              plannedFor: '2026-07-29',
              mealType: 'LUNCH',
              title: 'Rajčatová polévka',
              servings: '2',
            },
          ],
          tomorrowMeal: null,
          shoppingList: {
            id: 'list-a',
            title: 'Běžný nákup',
            openItemCount: 4,
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const user = userEvent.setup();
    renderClient(<MealsDashboardWidget />);
    expect(await screen.findByText('Rajčatová polévka')).toBeInTheDocument();
    expect(screen.getByText('4').parentElement).toHaveTextContent(
      '4 otevřených položek v seznamu Běžný nákup.',
    );
    await user.click(screen.getByRole('button', { name: 'Přidat jídlo' }));
    expect(workspace.openOverlay).toHaveBeenCalledWith({
      kind: 'meal-plan-create',
    });
  });

  it('distinguishes a real empty dashboard from an API error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          today: '2026-07-29',
          todayMeals: [],
          tomorrowMeal: null,
          shoppingList: null,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const { unmount } = renderClient(<MealsDashboardWidget />);
    expect(
      await screen.findByText('Na dnešek není naplánované jídlo'),
    ).toBeInTheDocument();
    unmount();
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Server není dostupný.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    renderClient(<MealsDashboardWidget />);
    expect(
      await screen.findByText(/Přehled jídel se nepodařilo načíst/),
    ).toBeInTheDocument();
  });

  it('keeps meals workspace and quick dialogs under /app state', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'meals', screen: 'shopping' },
        overlay: {
          kind: 'meal-plan-create',
          plannedFor: '2026-07-29',
          recipeId: '10000000-0000-4000-8000-000000000001',
        },
      }),
    ).toEqual({
      view: { area: 'meals', screen: 'shopping' },
      overlay: {
        kind: 'meal-plan-create',
        plannedFor: '2026-07-29',
        recipeId: '10000000-0000-4000-8000-000000000001',
      },
    });
    expect(window.location.pathname).not.toContain('meals');
  });

  it('validates central recipe and meal edit overlays without exposing ids in URL', () => {
    expect(
      parseWorkspaceState({
        view: { area: 'meals', screen: 'recipes' },
        overlay: {
          kind: 'recipe-edit',
          recipeId: '10000000-0000-4000-8000-000000000001',
        },
      }),
    ).toEqual({
      view: { area: 'meals', screen: 'recipes' },
      overlay: {
        kind: 'recipe-edit',
        recipeId: '10000000-0000-4000-8000-000000000001',
      },
    });
    expect(
      parseWorkspaceState({
        view: { area: 'meals', screen: 'planner' },
        overlay: {
          kind: 'meal-plan-edit',
          entryId: '10000000-0000-4000-8000-000000000002',
          plannedFor: '2026-07-29',
        },
      }),
    ).toEqual({
      view: { area: 'meals', screen: 'planner' },
      overlay: {
        kind: 'meal-plan-edit',
        entryId: '10000000-0000-4000-8000-000000000002',
        plannedFor: '2026-07-29',
      },
    });
    expect(window.location.pathname).not.toContain(
      '10000000-0000-4000-8000-000000000002',
    );
  });
});
