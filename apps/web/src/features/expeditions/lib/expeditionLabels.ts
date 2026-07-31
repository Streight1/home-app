import type {
  GearCriticality,
  GearLoadType,
  PackingStatus,
  TripStatus,
  TripType,
} from '../types/expeditions.types.js';

export const LOAD_TYPE_LABELS: Record<GearLoadType, string> = {
  CARRIED: 'Nesené',
  WORN: 'Oblečené',
  CONSUMABLE: 'Spotřební',
};
export const CRITICALITY_LABELS: Record<GearCriticality, string> = {
  REQUIRED: 'Povinné',
  RECOMMENDED: 'Doporučené',
  OPTIONAL: 'Volitelné',
};
export const PACKING_STATUS_LABELS: Record<PackingStatus, string> = {
  PLANNED: 'Nesbaleno',
  PACKED: 'Sbaleno',
  MISSING: 'Chybí',
  EXCLUDED: 'Vynecháno',
};
export const TRIP_TYPE_LABELS: Record<TripType, string> = {
  DAY_HIKE: 'Jednodenní výlet',
  OVERNIGHT: 'Výprava s přenocováním',
  MULTI_DAY_TREK: 'Vícedenní přechod',
  HUT_TO_HUT: 'Přechod mezi chatami',
  CAMPING: 'Kempování',
  OTHER: 'Jiná výprava',
};
export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
  PLANNING: 'Plánování',
  PACKING: 'Balení',
  READY: 'Připraveno podle seznamu',
  IN_PROGRESS: 'Probíhá',
  COMPLETED: 'Dokončeno',
  ARCHIVED: 'Archivováno',
};

export function formatWeight(grams: number) {
  if (grams < 1000) return `${grams.toLocaleString('cs-CZ')} g`;
  return `${(grams / 1000).toLocaleString('cs-CZ', {
    maximumFractionDigits: 2,
  })} kg`;
}

export const todayDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${String(year)}-${month}-${day}`;
};
