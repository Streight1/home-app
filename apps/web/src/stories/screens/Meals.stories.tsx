import type { Meta, StoryObj } from '@storybook/react-vite';
import { MealsDashboardWidget } from '../../features/meals/components/dashboard/MealsDashboardWidget.js';
import { MealPlanDialog } from '../../features/meals/components/dialogs/MealPlanDialog.js';
import { RecipeDialog } from '../../features/meals/components/dialogs/RecipeDialog.js';
import { MealsPage } from '../../features/meals/pages/MealsPage.js';
import type {
  MealPlanEntry,
  MealsDashboard,
  PantryItem,
  Recipe,
  ShoppingList,
} from '../../features/meals/types/meals.types.js';
import { AppShell } from '../../layouts/AppShell/AppShell.js';

const member = {
  id: '83000000-0000-4000-8000-000000000001',
  email: 'jana@example.test',
  displayName: 'Jana Nováková',
  avatarUrl: null,
  role: 'OWNER',
  calendarColorToken: 'rose',
} as const;

const recipe: Recipe = {
  id: '83000000-0000-4000-8000-000000000002',
  title: 'Rajčatová polévka',
  description: 'Lehká polévka z rajčat a čerstvých bylinek.',
  servings: '4',
  preparationMinutes: 15,
  cookingMinutes: 30,
  restingMinutes: undefined,
  difficulty: 'EASY',
  category: {
    id: '83000000-0000-4000-8000-000000000003',
    name: 'Polévky',
  },
  sourceLabel: '',
  sourceUrl: '',
  notes: '',
  isFavorite: true,
  tags: [
    { id: '83000000-0000-4000-8000-000000000004', name: 'Rychlé' },
    {
      id: '83000000-0000-4000-8000-000000000005',
      name: 'Vegetariánské',
    },
  ],
  archived: false,
  ingredients: [
    {
      id: '83000000-0000-4000-8000-000000000006',
      ingredientId: '83000000-0000-4000-8000-000000000007',
      ingredientName: 'Rajčata',
      name: 'Rajčata',
      quantity: '800',
      unit: 'G',
      isOptional: false,
      position: 0,
    },
    {
      id: '83000000-0000-4000-8000-000000000008',
      ingredientId: '83000000-0000-4000-8000-000000000009',
      ingredientName: 'Bazalka',
      name: 'Bazalka',
      quantity: null,
      unit: 'AS_NEEDED',
      isOptional: false,
      position: 1,
    },
  ],
  steps: [
    {
      id: '83000000-0000-4000-8000-000000000010',
      title: 'Základ',
      instruction: 'Rajčata krátce poduste a rozmixujte.',
      durationMinutes: 20,
      position: 0,
    },
    {
      id: '83000000-0000-4000-8000-000000000011',
      title: 'Dochucení',
      instruction: 'Přidejte bazalku a nechte krátce provařit.',
      durationMinutes: 10,
      position: 1,
    },
  ],
  documents: [],
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-15T10:00:00.000Z',
};

const meal: MealPlanEntry = {
  id: '83000000-0000-4000-8000-000000000012',
  plannedFor: '2026-07-15',
  mealType: 'LUNCH',
  customMealTypeLabel: null,
  recipe: { id: recipe.id, title: recipe.title, archived: false },
  title: recipe.title,
  servings: '2',
  notes: null,
  participants: [
    {
      id: member.id,
      displayName: member.displayName,
      avatarUrl: null,
      colorToken: 'rose',
    },
  ],
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-01T10:00:00.000Z',
};

const shoppingList: ShoppingList = {
  id: '83000000-0000-4000-8000-000000000013',
  title: 'Běžný nákup',
  status: 'OPEN',
  isDefault: true,
  archived: false,
  openItemCount: 2,
  items: [
    {
      id: '83000000-0000-4000-8000-000000000014',
      ingredient: {
        id: '83000000-0000-4000-8000-000000000007',
        name: 'Rajčata',
      },
      text: 'Rajčata',
      quantity: '1.5',
      unit: 'KG',
      customUnitLabel: null,
      category: {
        id: '83000000-0000-4000-8000-000000000015',
        name: 'Ovoce a zelenina',
        sortOrder: 0,
      },
      note: null,
      source: 'MEAL_PLAN',
      checked: false,
      checkedAt: null,
      sortOrder: 0,
      generatedSourceCount: 1,
    },
    {
      id: '83000000-0000-4000-8000-000000000016',
      ingredient: null,
      text: 'Pečivo',
      quantity: '2',
      unit: 'PIECE',
      customUnitLabel: null,
      category: {
        id: '83000000-0000-4000-8000-000000000017',
        name: 'Pečivo',
        sortOrder: 1,
      },
      note: null,
      source: 'MANUAL',
      checked: false,
      checkedAt: null,
      sortOrder: 1,
      generatedSourceCount: 0,
    },
    {
      id: '83000000-0000-4000-8000-000000000018',
      ingredient: null,
      text: 'Ovesné vločky',
      quantity: '1',
      unit: 'PACKAGE',
      customUnitLabel: null,
      category: null,
      note: null,
      source: 'MANUAL',
      checked: true,
      checkedAt: '2026-07-15T09:00:00.000Z',
      sortOrder: 2,
      generatedSourceCount: 0,
    },
  ],
  createdAt: '2026-07-01T10:00:00.000Z',
  updatedAt: '2026-07-15T10:00:00.000Z',
};

const pantry: PantryItem = {
  id: '83000000-0000-4000-8000-000000000019',
  ingredient: {
    id: '83000000-0000-4000-8000-000000000020',
    name: 'Mouka',
  },
  quantity: '500',
  unit: 'G',
  status: 'LOW',
  expiresOn: '2026-10-30',
  locationLabel: 'Spíž',
  note: null,
  updatedAt: '2026-07-15T10:00:00.000Z',
};

const dashboard: MealsDashboard = {
  today: '2026-07-15',
  todayMeals: [meal],
  tomorrowMeal: {
    ...meal,
    id: '83000000-0000-4000-8000-000000000021',
    plannedFor: '2026-07-16',
    mealType: 'DINNER',
  },
  shoppingList: {
    id: shoppingList.id,
    title: shoppingList.title,
    openItemCount: shoppingList.openItemCount,
  },
};

function installFixture() {
  window.fetch = (input) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    const path = new URL(url, window.location.origin).pathname;
    const body = path.endsWith('/auth/me')
      ? {
          user: member,
          activeHousehold: {
            id: '83000000-0000-4000-8000-000000000022',
            name: 'Moje domácnost',
            role: 'OWNER',
          },
        }
      : path.endsWith('/meal-plan')
        ? { items: [meal], members: [member] }
        : path.endsWith('/shopping-lists')
          ? { items: [shoppingList] }
          : path.endsWith('/pantry')
            ? { items: [pantry] }
            : path.endsWith('/meals/dashboard')
              ? dashboard
              : path.endsWith('/recipe-categories')
                ? {
                    items: [recipe.category],
                    tags: recipe.tags,
                  }
                : path.endsWith('/shopping-categories')
                  ? {
                      items: shoppingList.items
                        .map(({ category }) => category)
                        .filter(Boolean),
                    }
                  : path.endsWith('/documents/picker')
                    ? { items: [] }
                    : path.endsWith(`/recipes/${recipe.id}`)
                      ? recipe
                      : path.endsWith('/recipes')
                        ? {
                            items: [recipe],
                            pagination: {
                              page: 1,
                              pageSize: 20,
                              totalItems: 1,
                              totalPages: 1,
                            },
                          }
                        : { items: [] };
    return Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
  };
}

function MealsScreen({
  screen = 'planner',
}: {
  screen?: 'planner' | 'recipes' | 'shopping' | 'pantry';
}) {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <MealsPage
        role="OWNER"
        screen={screen}
        onScreenChange={() => undefined}
      />
    </AppShell>
  );
}

function MealsDialogScreen({ kind }: { kind: 'recipe' | 'meal' }) {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="rounded-lg border border-border bg-surface-raised p-6">
        <h1 className="text-page-title font-semibold">Jídelníček a nákupy</h1>
      </div>
      {kind === 'recipe' ? (
        <RecipeDialog open onOpenChange={() => undefined} />
      ) : (
        <MealPlanDialog
          open
          plannedFor="2026-07-15"
          onOpenChange={() => undefined}
        />
      )}
    </AppShell>
  );
}

function MealsDashboardScreen() {
  installFixture();
  return (
    <AppShell
      householdName="Moje domácnost"
      displayName={member.displayName}
      avatarUrl={null}
      isLoggingOut={false}
      onLogout={() => undefined}
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <MealsDashboardWidget />
      </div>
    </AppShell>
  );
}

const meta = {
  title: 'Screens/Meals',
  component: MealsScreen,
  parameters: { route: '/app', workspace: 'meals' },
} satisfies Meta<typeof MealsScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PlannerLight: Story = {
  parameters: { theme: 'light' },
};

export const PlannerDark: Story = {
  parameters: { theme: 'dark' },
};

export const RecipesLight: Story = {
  args: { screen: 'recipes' },
  parameters: { theme: 'light' },
};

export const ShoppingLight: Story = {
  args: { screen: 'shopping' },
  parameters: { theme: 'light' },
};

export const PantryDark: Story = {
  args: { screen: 'pantry' },
  parameters: { theme: 'dark' },
};

export const RecipeCreateDialog: Story = {
  render: () => <MealsDialogScreen kind="recipe" />,
  parameters: { theme: 'light' },
};

export const MealCreateDialog: Story = {
  render: () => <MealsDialogScreen kind="meal" />,
  parameters: { theme: 'dark' },
};

export const DashboardWidgetLight: Story = {
  render: () => <MealsDashboardScreen />,
  parameters: { theme: 'light' },
};
