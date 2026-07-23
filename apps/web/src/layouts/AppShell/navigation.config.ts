import {
  CalendarDays,
  Car,
  CircleDollarSign,
  FileText,
  House,
  LayoutDashboard,
  ListTodo,
  MoreHorizontal,
  Package,
  Settings,
  Soup,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import type { WorkspaceView } from '../../app/workspace-navigation/workspace-navigation.types.js';

export type NavigationArea = WorkspaceView['area'];

export interface NavigationItem {
  label: string;
  icon: LucideIcon;
  available: boolean;
  area?: NavigationArea;
}

export const desktopNavigation: readonly NavigationItem[] = [
  {
    label: 'Přehled',
    icon: LayoutDashboard,
    available: true,
    area: 'dashboard',
  },
  { label: 'Dokumenty', icon: FileText, available: true, area: 'documents' },
  { label: 'Úkoly', icon: ListTodo, available: true, area: 'tasks' },
  {
    label: 'Bucket list',
    icon: Sparkles,
    available: true,
    area: 'bucket-list',
  },
  {
    label: 'Finance',
    icon: CircleDollarSign,
    available: true,
    area: 'finance',
  },
  { label: 'Majetek', icon: Package, available: false },
  { label: 'Vozidla', icon: Car, available: false },
  { label: 'Kalendář', icon: CalendarDays, available: true, area: 'calendar' },
  { label: 'Jídelníček', icon: Soup, available: false },
  { label: 'Nastavení', icon: Settings, available: true, area: 'settings' },
];

export const mobileNavigation: readonly NavigationItem[] = [
  { label: 'Přehled', icon: House, available: true, area: 'dashboard' },
  {
    label: 'Finance',
    icon: CircleDollarSign,
    available: true,
    area: 'finance',
  },
  { label: 'Úkoly', icon: ListTodo, available: true, area: 'tasks' },
  { label: 'Dokumenty', icon: FileText, available: true, area: 'documents' },
  { label: 'Více', icon: MoreHorizontal, available: true },
];

export function workspaceViewForArea(area: NavigationArea): WorkspaceView {
  if (area === 'documents') return { area, screen: 'list' };
  if (area === 'tasks') return { area, screen: 'list' };
  if (area === 'calendar') return { area, screen: 'calendar' };
  if (area === 'bucket-list') return { area, screen: 'overview' };
  if (area === 'finance') return { area, screen: 'overview' };
  if (area === 'settings') return { area, screen: 'general' };
  return { area: 'dashboard' };
}
