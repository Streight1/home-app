import { useState } from 'react';
import { useWorkspaceNavigation } from '../../../app/workspace-navigation/useWorkspaceNavigation.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { LoadingScreen } from '../../../components/ui/LoadingScreen/LoadingScreen.js';
import type { HouseholdRole } from '../../household/household.public.js';
import { CalendarAgendaList } from '../components/calendar/CalendarAgendaList.js';
import { CalendarToolbar } from '../components/calendar/CalendarToolbar.js';
import { MonthCalendar } from '../components/calendar/MonthCalendar.js';
import { WeekCalendar } from '../components/calendar/WeekCalendar.js';
import { CalendarTimeGrid } from '../components/time-grid/CalendarTimeGrid.js';
import { CalendarTemplateManagerDialog } from '../components/templates/CalendarTemplateManagerDialog.js';
import { useCalendarFeed } from '../hooks/useCalendar.js';
import { feedRange, localIsoDate, shiftPeriod } from '../lib/calendarDate.js';
import type { CalendarViewMode } from '../types/calendar.types.js';
import { useRememberedCalendarView } from '../../location/hooks/useRememberedCalendarView.js';

export function CalendarPage({ role }: { role: HouseholdRole }) {
  const workspace = useWorkspaceNavigation();
  const rememberedView = useRememberedCalendarView();
  const view: CalendarViewMode = rememberedView.view;
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const range = feedRange(date, view);
  const feed = useCalendarFeed(range.from, range.to);
  const items = feed.data?.items ?? [];
  const canMutate = role !== 'VIEWER';
  const selectDate = (next: Date) => {
    setSelectedDate(next);
    setDate(next);
  };
  return (
    <div className="grid gap-5">
      <CalendarToolbar
        date={date}
        view={view}
        canMutate={canMutate}
        onViewChange={rememberedView.select}
        onToday={() => {
          const today = new Date();
          setDate(today);
          setSelectedDate(today);
        }}
        onPrevious={() => setDate((current) => shiftPeriod(current, view, -1))}
        onNext={() => setDate((current) => shiftPeriod(current, view, 1))}
        onCreate={() =>
          workspace.openOverlay({
            kind: 'calendar-create',
            date: localIsoDate(selectedDate),
          })
        }
        onTemplates={() => setTemplatesOpen(true)}
      />
      {feed.isLoading ? <LoadingScreen message="Načítáme kalendář…" /> : null}
      {feed.isError ? (
        <InlineAlert variant="danger">{feed.error.message}</InlineAlert>
      ) : null}
      {rememberedView.saveError ? (
        <InlineAlert variant="warning">
          Zobrazení zůstane aktivní, ale nepodařilo se ho uložit pro další
          návštěvu.
        </InlineAlert>
      ) : null}
      {view === 'month' ? (
        <>
          <MonthCalendar
            date={date}
            selectedDate={selectedDate}
            items={items}
            onSelectDate={selectDate}
          />
          <section className="md:hidden">
            <h2 className="mb-3 text-section-title font-semibold">
              {selectedDate.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h2>
            <CalendarAgendaList items={items} date={selectedDate} />
          </section>
        </>
      ) : null}
      {view === 'week' ? (
        <WeekCalendar
          date={date}
          items={items}
          onSelectDate={(next) => {
            setSelectedDate(next);
            setDate(next);
          }}
        />
      ) : null}
      {view === 'day' ? (
        <CalendarTimeGrid date={date} items={items} mode="day" />
      ) : null}
      {view === 'agenda' ? (
        <CalendarAgendaList items={items} date={date} filterDate={false} />
      ) : null}
      <CalendarTemplateManagerDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
      />
    </div>
  );
}
