import { useCallback } from 'react';
import { BrandMark } from '../../../components/ui/BrandMark/BrandMark.js';
import { Card } from '../../../components/ui/Card/Card.js';
import { useGoogleLogin } from '../hooks/useGoogleLogin.js';
import { GoogleSignInButton } from './GoogleSignInButton.js';
import { LoginError } from './LoginError.js';

export function LoginPanel() {
  const login = useGoogleLogin();
  const handleCredential = useCallback(
    (credential: string) => login.submitCredential(credential),
    [login.submitCredential],
  );

  return (
    <Card
      className="w-full max-w-md border-border-strong bg-surface-raised p-6 shadow-lg sm:p-8"
      aria-labelledby="login-title"
    >
      <div className="mb-8 lg:hidden">
        <BrandMark />
      </div>
      <h1
        id="login-title"
        className="text-page-title font-semibold tracking-[-0.025em] text-text"
      >
        Centrum domácnosti
      </h1>
      <p className="mt-3 text-body leading-7 text-text-muted">
        Vše důležité pro domácnost na jednom místě.
      </p>
      <div className="mt-8">
        <GoogleSignInButton
          disabled={login.isPending}
          onCredential={handleCredential}
        />
      </div>
      {login.isPending ? (
        <p
          className="mt-4 text-center text-body-sm text-text-muted"
          role="status"
        >
          Dokončujeme přihlášení…
        </p>
      ) : null}
      <LoginError message={login.errorMessage} />
      <p className="mt-8 border-t border-border pt-5 text-caption leading-5 text-text-muted">
        Přihlášení ověřuje Google. HomeApp neukládá vaše heslo ani nezískává
        přístup k ostatním službám Google.
      </p>
    </Card>
  );
}
