import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { MealsPage } from '../pages/MealsPage.js';

export function MealsWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'meals' }>;
  role: HouseholdRole;
}) {
  const workspace = useWorkspaceNavigation();
  return (
    <MealsPage
      role={role}
      screen={view.screen === 'recipe' ? 'recipes' : view.screen}
      {...(view.screen === 'recipe' ? { selectedRecipeId: view.recipeId } : {})}
      onScreenChange={(screen) => workspace.navigate({ area: 'meals', screen })}
      onCloseRecipe={() =>
        workspace.navigate({ area: 'meals', screen: 'recipes' })
      }
      onSelectRecipe={(recipeId) =>
        workspace.navigate({ area: 'meals', screen: 'recipe', recipeId })
      }
    />
  );
}
