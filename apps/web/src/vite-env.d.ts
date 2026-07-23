/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_CSRF_COOKIE_NAME: string;
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_APP_ENV_LABEL?: string;
}

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize(config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode: 'popup';
    auto_select: false;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      type: 'standard';
      theme: 'outline';
      size: 'large';
      text: 'signin_with';
      shape: 'rectangular';
      width: number;
    },
  ): void;
  cancel(): void;
}

interface Window {
  google?: { accounts: { id: GoogleAccountsId } };
}
