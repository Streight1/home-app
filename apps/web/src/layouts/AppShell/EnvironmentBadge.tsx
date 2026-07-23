import { Badge } from '../../components/ui/Badge/Badge.js';

export function EnvironmentBadge({ label }: { label: string | null }) {
  if (!label) return null;
  return <Badge variant="warning">{label}</Badge>;
}
