import {
  Backpack,
  CalendarPlus,
  FilePlus2,
  Home,
  ListPlus,
  ListTodo,
  Mountain,
  ReceiptText,
  ShoppingBasket,
  Soup,
  Utensils,
  WalletCards,
  Wrench,
} from 'lucide-react';
import { useMemo } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import type { HouseholdRole } from '../../auth/types/auth.types.js';
import { useCreateCalendarEventDialog } from '../../calendar/hooks/useCreateCalendarEventDialog.js';
import type { SearchCommand } from '../components/SearchCommandList.js';

export function useSearchCommands(role: HouseholdRole | undefined) {
  const workspace = useWorkspaceNavigation();
  const openCreateEvent = useCreateCalendarEventDialog();
  return useMemo<SearchCommand[]>(() => {
    const navigation: SearchCommand[] = [
      {
        id: 'home',
        label: 'Přejít na Domů',
        description: 'Otevřít hlavní přehled',
        icon: Home,
        run: () => workspace.navigate({ area: 'dashboard' }),
      },
      {
        id: 'tasks',
        label: 'Přejít na Úkoly',
        description: 'Úkoly a údržba domácnosti',
        icon: ListTodo,
        run: () => workspace.navigate({ area: 'tasks', screen: 'list' }),
      },
      {
        id: 'calendar',
        label: 'Přejít na Kalendář',
        description: 'Denní, týdenní a měsíční pohled',
        icon: CalendarPlus,
        run: () => workspace.navigate({ area: 'calendar', screen: 'calendar' }),
      },
      {
        id: 'finance',
        label: 'Přejít na Finance',
        description: 'Účty, transakce a přehledy',
        icon: WalletCards,
        run: () => workspace.navigate({ area: 'finance', screen: 'overview' }),
      },
      {
        id: 'recipes',
        label: 'Přejít na Recepty',
        description: 'Recepty, jídelníček a nákupy',
        icon: Utensils,
        run: () => workspace.navigate({ area: 'meals', screen: 'recipes' }),
      },
      {
        id: 'expeditions',
        label: 'Přejít na Výpravy',
        description: 'Výpravy, gearlisty a výbava',
        icon: Mountain,
        run: () =>
          workspace.navigate({ area: 'expeditions', screen: 'overview' }),
      },
    ];
    if (role === 'VIEWER' || !role) return navigation;
    return [
      ...navigation,
      {
        id: 'new-document',
        label: 'Nový dokument',
        description: 'Otevřít existující formulář dokumentu',
        icon: FilePlus2,
        run: () => workspace.navigate({ area: 'documents', screen: 'new' }),
      },
      {
        id: 'new-task',
        label: 'Nový úkol',
        description: 'Otevřít centrální formulář úkolu',
        icon: ListPlus,
        run: () => workspace.openOverlay({ kind: 'task-create' }),
      },
      {
        id: 'new-event',
        label: 'Nová událost',
        description: 'Otevřít centrální formulář kalendáře',
        icon: CalendarPlus,
        run: () => openCreateEvent({ source: 'global-add' }),
      },
      {
        id: 'new-maintenance',
        label: 'Nový plán údržby',
        description: 'Naplánovat údržbu domácnosti',
        icon: Wrench,
        run: () => workspace.openOverlay({ kind: 'maintenance-plan-create' }),
      },
      {
        id: 'new-expense',
        label: 'Přidat výdaj',
        description: 'Otevřít formulář finanční transakce',
        icon: ReceiptText,
        run: () =>
          workspace.openOverlay({
            kind: 'finance-transaction',
            type: 'expense',
          }),
      },
      {
        id: 'new-recipe',
        label: 'Nový recept',
        description: 'Otevřít centrální formulář receptu',
        icon: Utensils,
        run: () => workspace.openOverlay({ kind: 'recipe-create' }),
      },
      {
        id: 'new-meal',
        label: 'Naplánovat jídlo',
        description: 'Přidat položku jídelníčku',
        icon: Soup,
        run: () => workspace.openOverlay({ kind: 'meal-plan-create' }),
      },
      {
        id: 'new-shopping',
        label: 'Přidat položku nákupu',
        description: 'Přidat položku do nákupního seznamu',
        icon: ShoppingBasket,
        run: () => workspace.openOverlay({ kind: 'shopping-item-create' }),
      },
      {
        id: 'new-trip',
        label: 'Nová výprava',
        description: 'Otevřít centrální formulář výpravy',
        icon: Mountain,
        run: () => workspace.openOverlay({ kind: 'trip-create' }),
      },
      {
        id: 'new-gear',
        label: 'Nová položka výbavy',
        description: 'Otevřít centrální formulář výbavy',
        icon: Backpack,
        run: () => workspace.openOverlay({ kind: 'gear-item-create' }),
      },
    ];
  }, [openCreateEvent, role, workspace]);
}
