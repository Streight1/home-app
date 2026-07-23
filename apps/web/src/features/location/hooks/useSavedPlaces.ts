import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createSavedPlace, getSavedPlaces } from '../api/locationApi.js';

export function useSavedPlaces() {
  return useQuery({
    queryKey: ['location', 'places'],
    queryFn: getSavedPlaces,
  });
}
export function useCreateSavedPlace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: createSavedPlace,
    onSuccess: () =>
      client.invalidateQueries({ queryKey: ['location', 'places'] }),
  });
}
