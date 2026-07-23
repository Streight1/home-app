export const corsAllowedMethods = [
  'GET',
  'HEAD',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
  'OPTIONS',
] as const;

export function createCorsOptions(origin: string) {
  return {
    origin,
    credentials: true,
    methods: [...corsAllowedMethods],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
  };
}
