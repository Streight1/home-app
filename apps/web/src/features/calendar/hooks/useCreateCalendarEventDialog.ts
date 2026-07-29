import { useCallback } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import {
  createCalendarEventDraft,
  type CreateCalendarEventDraftInput,
} from '../lib/createCalendarEventDraft.js';

export function useCreateCalendarEventDialog() {
  const workspace = useWorkspaceNavigation();
  return useCallback(
    (input: CreateCalendarEventDraftInput) =>
      workspace.openOverlay({
        kind: 'calendar-create',
        draft: createCalendarEventDraft(input),
      }),
    [workspace],
  );
}
