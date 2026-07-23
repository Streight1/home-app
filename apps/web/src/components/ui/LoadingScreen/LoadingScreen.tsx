import { Spinner } from '../Spinner/Spinner.js';

export function LoadingScreen({
  message = 'Ověřujeme přihlášení…',
  embedded = false,
}: {
  message?: string;
  embedded?: boolean;
}) {
  const Container = embedded ? 'div' : 'main';
  return (
    <Container
      className={
        embedded
          ? 'grid min-h-48 place-items-center px-6'
          : 'grid min-h-screen place-items-center bg-background px-6'
      }
    >
      <div
        className="flex flex-col items-center gap-4 text-center"
        role="status"
        aria-live="polite"
      >
        <Spinner />
        <p className="text-sm font-medium text-text-secondary">{message}</p>
      </div>
    </Container>
  );
}
