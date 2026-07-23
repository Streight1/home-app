export function MapyAttribution({ context = 'Místa' }: { context?: string }) {
  return (
    <div
      className="flex items-center gap-2 text-caption text-text-muted"
      aria-label={`${context} poskytují Mapy.com`}
    >
      <span>{context}:</span>
      <a
        href="https://mapy.com/"
        target="_blank"
        rel="noreferrer noopener"
        className="rounded-sm focus-visible:outline-2 focus-visible:outline-focus"
      >
        <img
          src="https://api.mapy.com/img/api/logo.svg"
          alt="Mapy.com"
          className="h-3 w-auto"
        />
      </a>
      <a
        href="https://api.mapy.com/copyright"
        target="_blank"
        rel="noreferrer noopener"
        className="hover:text-text focus-visible:outline-2 focus-visible:outline-focus"
      >
        Seznam.cz a.s. a další
      </a>
    </div>
  );
}
