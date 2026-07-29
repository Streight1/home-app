import { describe, expect, it } from 'vitest';
import {
  desktopNavigation,
  getPrimaryNavigationArea,
  mobileNavigation,
} from './navigation.config.js';

describe('application primary navigation hierarchy', () => {
  it('does not expose maintenance as an independent main navigation item', () => {
    expect(desktopNavigation.map((item) => item.area)).not.toContain(
      'maintenance',
    );
    expect(mobileNavigation.map((item) => item.area)).not.toContain(
      'maintenance',
    );
    expect(desktopNavigation.map((item) => item.label)).not.toContain('Údržba');
  });

  it('maps every maintenance screen to the Tasks primary area', () => {
    expect(
      getPrimaryNavigationArea({
        area: 'maintenance',
        screen: 'plan',
        planId: '10000000-0000-4000-8000-000000000001',
      }),
    ).toBe('tasks');
    expect(getPrimaryNavigationArea({ area: 'tasks', screen: 'list' })).toBe(
      'tasks',
    );
  });
});
