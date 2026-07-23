import { Component, type ErrorInfo, type ReactNode } from 'react';

interface AppErrorBoundaryProps {
  children: ReactNode;
}

export class AppErrorBoundary extends Component<
  AppErrorBoundaryProps,
  { failed: boolean }
> {
  public override state = { failed: false };

  public static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }

  public override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('UI render failed', {
      message: error.message,
      componentStack: info.componentStack,
    });
  }

  public override render(): ReactNode {
    if (this.state.failed) {
      return (
        <main className="grid min-h-screen place-items-center bg-background p-6">
          <div className="max-w-md rounded-lg border border-border bg-surface p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold text-text">
              Aplikaci se nepodařilo zobrazit
            </h1>
            <p className="mt-3 text-text-muted">
              Obnovte prosím stránku a zkuste to znovu.
            </p>
          </div>
        </main>
      );
    }
    return this.props.children;
  }
}
