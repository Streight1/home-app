import type { WorkspaceView } from '../../../app/workspace-navigation/workspace-navigation.types.js';
import type { HouseholdRole } from '../types/document.types.js';
import { DocumentCreatePage } from '../pages/DocumentCreatePage.js';
import { DocumentDetailPage } from '../pages/DocumentDetailPage.js';
import { DocumentExtractionPage } from '../pages/DocumentExtractionPage.js';
import { DocumentPreviewPage } from '../pages/DocumentPreviewPage.js';
import { DocumentsPage } from '../pages/DocumentsPage.js';

export function DocumentsWorkspaceView({
  view,
  role,
}: {
  view: Extract<WorkspaceView, { area: 'documents' }>;
  role: HouseholdRole;
}) {
  if (view.screen === 'list') return <DocumentsPage role={role} />;
  if (view.screen === 'new') return <DocumentCreatePage role={role} />;
  if (view.screen === 'trash') return <DocumentsPage role={role} trash />;
  if (view.screen === 'preview')
    return <DocumentPreviewPage documentId={view.documentId} />;
  if (view.screen === 'extraction')
    return <DocumentExtractionPage role={role} documentId={view.documentId} />;
  if ('documentId' in view)
    return <DocumentDetailPage role={role} documentId={view.documentId} />;
  return null;
}
