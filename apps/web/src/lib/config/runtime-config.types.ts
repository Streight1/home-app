export interface HomeAppPublicRuntimeConfig {
  API_URL: string;
  GOOGLE_CLIENT_ID: string;
  APP_ENV_LABEL: string;
  MAX_UPLOAD_BYTES: number;
  FINANCE_IMPORT_MAX_FILE_BYTES: number;
  CSRF_COOKIE_NAME: string;
}

export interface WebEnvironment {
  apiUrl: string;
  googleClientId: string;
  appEnvLabel: string | null;
  maxUploadBytes: number;
  financeImportMaxFileBytes: number;
  csrfCookieName: string;
}
