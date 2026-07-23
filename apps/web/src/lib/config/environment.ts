export const webEnvironment = {
  get apiUrl(): string {
    return import.meta.env.VITE_API_URL.replace(/\/$/, '');
  },
  get googleClientId(): string {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID;
  },
  get csrfCookieName(): string {
    return import.meta.env.VITE_CSRF_COOKIE_NAME;
  },
  get maxUploadBytes(): number {
    const configured = Number(import.meta.env.VITE_MAX_UPLOAD_BYTES);
    return Number.isSafeInteger(configured) && configured > 0
      ? configured
      : 26_214_400;
  },
  get financeImportMaxFileBytes(): number {
    const configured = Number(
      import.meta.env.VITE_FINANCE_IMPORT_MAX_FILE_BYTES,
    );
    return Number.isSafeInteger(configured) && configured > 0
      ? configured
      : 20_971_520;
  },
  get appEnvLabel(): string | null {
    const value = import.meta.env.VITE_APP_ENV_LABEL?.trim();
    return value ? value.slice(0, 32) : null;
  },
};
