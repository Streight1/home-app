import { useEffect, useRef, useState } from 'react';
import { webEnvironment } from '../../../lib/config/environment.js';

const scriptId = 'google-identity-services';
const scriptUrl = 'https://accounts.google.com/gsi/client';
let initializedGoogle: Window['google'];
let initializedClientId: string | null = null;
let activeCredentialHandler: ((credential: string) => void) | null = null;

function initializeGoogleIdentity(
  google: NonNullable<Window['google']>,
  clientId: string,
  onCredential: (credential: string) => void,
): void {
  activeCredentialHandler = onCredential;
  if (initializedGoogle === google && initializedClientId === clientId) return;

  google.accounts.id.initialize({
    client_id: clientId,
    callback: ({ credential }) => activeCredentialHandler?.(credential),
    ux_mode: 'popup',
    auto_select: false,
  });
  initializedGoogle = google;
  initializedClientId = clientId;
}

interface GoogleSignInButtonProps {
  disabled: boolean;
  onCredential: (credential: string) => void;
}

export function GoogleSignInButton({
  disabled,
  onCredential,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const clientId = webEnvironment.googleClientId;
    if (!clientId) {
      setError('Přihlášení přes Google není nakonfigurované.');
      return;
    }
    const renderButton = () => {
      const container = containerRef.current;
      if (!container || !window.google) {
        setError('Přihlášení přes Google se nepodařilo načíst.');
        return;
      }
      container.replaceChildren();
      initializeGoogleIdentity(window.google, clientId, onCredential);
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'rectangular',
        width: Math.min(320, Math.max(240, container.clientWidth || 320)),
      });
    };
    const handleError = () =>
      setError('Přihlášení přes Google se nepodařilo načíst.');
    let script = document.querySelector<HTMLScriptElement>(`#${scriptId}`);
    if (window.google) {
      renderButton();
    } else {
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = scriptUrl;
        script.async = true;
        script.defer = true;
        document.head.append(script);
      }
      script.addEventListener('load', renderButton);
      script.addEventListener('error', handleError);
    }
    return () => {
      script?.removeEventListener('load', renderButton);
      script?.removeEventListener('error', handleError);
      window.google?.accounts.id.cancel();
      if (activeCredentialHandler === onCredential)
        activeCredentialHandler = null;
    };
  }, [onCredential]);

  return (
    <div
      aria-busy={disabled}
      className={disabled ? 'pointer-events-none opacity-60' : undefined}
    >
      <div
        ref={containerRef}
        data-testid="google-button-container"
        className="flex min-h-11 justify-center"
      />
      {error ? (
        <p className="mt-3 text-body-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
