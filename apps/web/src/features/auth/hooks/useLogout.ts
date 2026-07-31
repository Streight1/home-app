import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { logout } from '../api/authApi.js';
import { AUTH_QUERY_KEY } from './useCurrentUser.js';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { clearAllRecentSearchItems } from '../../global-search/storage/recentSearchItems.js';

export function useLogout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const workspace = useWorkspaceNavigation();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
      workspace.clear();
      clearAllRecentSearchItems();
      void navigate('/login', { replace: true });
    },
  });
}
