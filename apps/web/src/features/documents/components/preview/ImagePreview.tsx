export function ImagePreview({
  objectUrl,
  title,
}: {
  objectUrl: string;
  title: string;
}) {
  return (
    <div className="grid min-h-80 place-items-center rounded-lg border border-border bg-canvas-subtle p-3">
      <img
        src={objectUrl}
        alt={`Náhled dokumentu ${title}`}
        className="max-h-[70vh] max-w-full object-contain"
      />
    </div>
  );
}
