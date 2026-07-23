export function PdfPreview({
  objectUrl,
  title,
}: {
  objectUrl: string;
  title: string;
}) {
  return (
    <object
      data={objectUrl}
      type="application/pdf"
      aria-label={`Náhled PDF: ${title}`}
      className="min-h-[65vh] w-full rounded-lg border border-border bg-surface"
    >
      <p className="p-5 text-body-sm text-text-muted">
        Prohlížeč neumí PDF zobrazit. Použijte stažení souboru.
      </p>
    </object>
  );
}
