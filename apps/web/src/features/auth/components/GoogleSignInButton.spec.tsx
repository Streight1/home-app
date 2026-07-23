import { render } from '@testing-library/react';
import { StrictMode } from 'react';
import { expect, it, vi } from 'vitest';
import { GoogleSignInButton } from './GoogleSignInButton.js';

it('initializes Google Identity Services only once in React StrictMode', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client.apps.googleusercontent.com');
  const initialize = vi.fn();
  window.google = {
    accounts: {
      id: {
        initialize,
        renderButton: vi.fn(),
        cancel: vi.fn(),
      },
    },
  };

  render(
    <StrictMode>
      <GoogleSignInButton disabled={false} onCredential={() => undefined} />
    </StrictMode>,
  );

  expect(initialize).toHaveBeenCalledOnce();
});
