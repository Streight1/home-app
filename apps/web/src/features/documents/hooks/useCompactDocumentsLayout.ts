import { useEffect, useState } from 'react';

const compactQuery = '(max-width: 1199px)';

export function useCompactDocumentsLayout(): boolean {
  const [compact, setCompact] = useState(
    () => window.matchMedia(compactQuery).matches,
  );
  useEffect(() => {
    const media = window.matchMedia(compactQuery);
    const update = () => setCompact(media.matches);
    media.addEventListener('change', update);
    update();
    return () => media.removeEventListener('change', update);
  }, []);
  return compact;
}
