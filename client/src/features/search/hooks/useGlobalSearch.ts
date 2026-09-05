import { useQuery } from '@tanstack/react-query';
import { searchApi } from '../api/search.api';
import { useDebounce } from '@/hooks/useDebounce';

export function useGlobalSearch(searchTerm: string) {
  const debouncedTerm = useDebounce(searchTerm.trim(), 250);

  return useQuery({
    queryKey: ['global-search', debouncedTerm],
    queryFn: () => searchApi.search(debouncedTerm),
    enabled: debouncedTerm.length >= 2,
    staleTime: 1000 * 30, // 30 seconds
  });
}
