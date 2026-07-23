import type { DashboardData } from '../../features/dashboard/types/dashboard.types.js';

export const dashboardFixture: DashboardData = {
  attention: [
    {
      id: 'attention-1',
      title: 'Zkontrolovat pojistnou smlouvu',
      meta: 'Fixture · do 18. července',
    },
    {
      id: 'attention-2',
      title: 'Potvrdit servis vozidla',
      meta: 'Fixture · čeká na potvrzení',
    },
  ],
  agenda: [
    { id: 'agenda-1', title: 'Převzetí zásilky', meta: 'Fixture · 10:30' },
    { id: 'agenda-2', title: 'Kontrola odečtu', meta: 'Fixture · 17:00' },
  ],
  financeSummary: '18 450 Kč',
  financeMeta: 'Fixture · výdaje v tomto období',
  recentDocuments: [
    {
      id: 'document-1',
      title: 'Pojištění domácnosti.pdf',
      meta: 'Fixture · přidáno 10. července',
    },
    {
      id: 'document-2',
      title: 'Vyúčtování energií.pdf',
      meta: 'Fixture · přidáno 8. července',
    },
  ],
  upcomingDeadlines: [
    {
      id: 'deadline-1',
      title: 'Obnova pojištění',
      meta: 'Fixture · 26. července',
    },
    {
      id: 'deadline-2',
      title: 'Technická kontrola',
      meta: 'Fixture · 4. srpna',
    },
  ],
};
