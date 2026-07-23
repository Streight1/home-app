import { Badge } from '../../../components/ui/Badge/Badge.js';
import type { DocumentStatus } from '../types/document.types.js';

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return status === 'ACTIVE' ? (
    <Badge variant="success">Aktivní</Badge>
  ) : (
    <Badge>Archivovaný</Badge>
  );
}
