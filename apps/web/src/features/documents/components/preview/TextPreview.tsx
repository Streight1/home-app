export function TextPreview({ text }: { text: string }) {
  return (
    <pre className="max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-canvas-subtle p-4 font-mono text-body-sm text-text">
      {text}
    </pre>
  );
}
