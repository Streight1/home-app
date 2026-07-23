import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { ApiError } from '../../../lib/api/apiError.js';
import { loginWithGoogle } from '../api/authApi.js';
import { AUTH_QUERY_KEY } from './useCurrentUser.js';

export function useGoogleLogin() {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const mutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (profile) => queryClient.setQueryData(AUTH_QUERY_KEY, profile),
    onError: (reason) =>
      setErrorMessage(
        reason instanceof ApiError
          ? reason.message
          : 'Přihlášení se nepodařilo. Zkuste to znovu.',
      ),
  });
  const mutate = mutation.mutate;

  const submitCredential = useCallback(
    (credential: string): void => {
      setErrorMessage(null);
      mutate(credential);
    },
    [mutate],
  );
  return { submitCredential, isPending: mutation.isPending, errorMessage };
}
