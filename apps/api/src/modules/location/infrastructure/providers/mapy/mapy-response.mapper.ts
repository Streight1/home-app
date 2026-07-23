import { MapyProviderError } from './mapy-api.client.js';

const objectValue = (value: unknown): Record<string, unknown> | null =>
  typeof value === 'object' && value !== null
    ? (value as Record<string, unknown>)
    : null;

export function mapMapySuggestions(value: unknown) {
  const root = objectValue(value);
  if (!root || !Array.isArray(root.items))
    throw new MapyProviderError('UPSTREAM');
  return root.items.map((item) => {
    const entity = objectValue(item);
    const position = objectValue(entity?.position);
    if (
      !entity ||
      !position ||
      typeof entity.name !== 'string' ||
      typeof entity.type !== 'string' ||
      typeof position.lat !== 'number' ||
      typeof position.lon !== 'number'
    )
      throw new MapyProviderError('UPSTREAM');
    const location =
      typeof entity.location === 'string' ? entity.location : null;
    return {
      providerPlaceId: null,
      primaryLabel: entity.name,
      secondaryLabel:
        location ?? (typeof entity.label === 'string' ? entity.label : null),
      formattedAddress: location ? `${entity.name}, ${location}` : entity.name,
      latitude: position.lat,
      longitude: position.lon,
      placeType: entity.type,
    };
  });
}

export function mapMapyRoute(value: unknown) {
  const root = objectValue(value);
  if (
    !root ||
    !Number.isInteger(root.length) ||
    !Number.isInteger(root.duration) ||
    Number(root.length) < 0 ||
    Number(root.duration) < 0
  )
    throw new MapyProviderError('UPSTREAM');
  return {
    distanceMeters: Number(root.length),
    durationSeconds: Number(root.duration),
    providerCalculatedAt: new Date(),
  };
}
