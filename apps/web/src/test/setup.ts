import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import {
  installTestPublicRuntimeConfig,
  resetTestPublicRuntimeConfig,
} from '../lib/config/test-runtime-config.js';

if (typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  });
}

beforeEach(() => {
  installTestPublicRuntimeConfig();
});

afterEach(() => {
  cleanup();
  document.cookie = 'homeapp_csrf=; Max-Age=0; path=/';
  document.querySelector('#google-identity-services')?.remove();
  delete window.google;
  window.localStorage.clear();
  resetTestPublicRuntimeConfig();
});
