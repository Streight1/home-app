import type { ReactNode } from 'react';
import { validateWebEnvironment } from '../../lib/config/environment.js';

export function RuntimeConfigGuard({ children }: { children: ReactNode }) {
  const error = validateWebEnvironment();
  if (!error) return children;

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <section
        className="max-w-lg rounded-lg border border-danger bg-surface p-8 text-center shadow-sm"
        role="alert"
        aria-labelledby="runtime-config-title"
      >
        <h1
          id="runtime-config-title"
          className="text-page-title font-semibold text-text"
        >
          Aplikaci nelze spustit
        </h1>
        <p className="mt-3 text-body text-text-muted">
          Veřejná konfigurace nasazení chybí nebo není platná. Obraťte se prosím
          na správce aplikace.
        </p>
      </section>
    </main>
  );
}
