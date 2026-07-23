import { useEffect, useState } from 'react';
import { previewDocumentFile } from '../api/documentFilesApi.js';

export function useDocumentPreview(documentId: string, enabled: boolean) {
  const [state, setState] = useState<{
    objectUrl: string | null;
    text: string | null;
    loading: boolean;
    error: unknown;
  }>({ objectUrl: null, text: null, loading: enabled, error: null });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    let objectUrl: string | null = null;
    setState({ objectUrl: null, text: null, loading: true, error: null });
    void previewDocumentFile(documentId, controller.signal)
      .then(async (blob) => {
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        const text = blob.type.startsWith('text/plain')
          ? await blob.text()
          : null;
        setState({ objectUrl, text, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({ objectUrl: null, text: null, loading: false, error });
      });
    return () => {
      controller.abort();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId, enabled]);
  return state;
}
