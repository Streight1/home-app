import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { suggestPlaces } from '../api/locationApi.js';

export function usePlaceSuggestions(query: string) {
  const [debounced, setDebounced] = useState(query.trim());
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(query.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [query]);
  return useQuery({
    queryKey: ['location', 'suggest', debounced],
    queryFn: ({ signal }) => suggestPlaces(debounced, signal),
    enabled: debounced.length >= 3,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
