import { useMemo, useState } from 'react';
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
import { feedRange, shiftPeriod } from '../lib/calendarDate.js';
import type { CalendarViewMode } from '../types/calendar.types.js';
import { useRememberedCalendarView } from '../../location/hooks/useRememberedCalendarView.js';
import { useCalendarPreferences } from '../../location/hooks/useCalendarPreferences.js';
import { useHouseholdMembers } from '../../household/household.public.js';
import { CalendarSelectionToolbar } from '../components/bulk/CalendarSelectionToolbar.js';
import { CalendarBulkEditDialog } from '../components/bulk/CalendarBulkEditDialog.js';
import { CalendarBulkDeleteDialog } from '../components/bulk/CalendarBulkDeleteDialog.js';
import { useCalendarQuickCreate } from '../hooks/useCalendarQuickCreate.js';
export function CalendarPage({ role }: { role: HouseholdRole }) {
  const rememberedView = useRememberedCalendarView();
  const preferences = useCalendarPreferences();
  const members = useHouseholdMembers();
  const quickCreate = useCalendarQuickCreate();
  const view: CalendarViewMode = rememberedView.view;
  const [date, setDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const range = feedRange(date, view);
  const feed = useCalendarFeed(range.from, range.to);
  const items = feed.data?.items ?? [];
  const selectableIds = useMemo(
    () =>
      items
        .filter(({ sourceType }) => sourceType === 'CALENDAR_EVENT')
        .map(({ id }) => id),
    [items],
  );
  const visibleItems =
    view !== 'month' && preferences.data?.showTravelBlocks === false
      ? items.filter(({ sourceType }) => sourceType !== 'TRAVEL_BLOCK')
      : items;
  const toggleSelection = (eventId: string) =>
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };
  const selectDate = (next: Date) => {
    setSelectedDate(next);
    setDate(next);
  };
  const canCreate = role !== 'VIEWER';
  return (
    <div className="grid gap-5">
      <CalendarToolbar
        date={date}
        view={view}
        canMutate={role !== 'VIEWER'}
        onViewChange={rememberedView.select}
        onToday={() => {
          const today = new Date();
          setDate(today);
          setSelectedDate(today);
        }}
        onPrevious={() => setDate((current) => shiftPeriod(current, view, -1))}
        onNext={() => setDate((current) => shiftPeriod(current, view, 1))}
        onCreate={() => quickCreate.fromToolbar(selectedDate)}
        onTemplates={() => setTemplatesOpen(true)}
        selectionMode={selectionMode}
        onSelectionModeChange={(active) => {
          setSelectionMode(active);
          if (!active) setSelectedIds(new Set());
        }}
      />
      {selectionMode ? (
        <CalendarSelectionToolbar
          selectedCount={selectedIds.size}
          selectableCount={selectableIds.length}
          onSelectAll={() => setSelectedIds(new Set(selectableIds))}
          onClear={() => setSelectedIds(new Set())}
          onEdit={() => setBulkEditOpen(true)}
          onDelete={() => setBulkDeleteOpen(true)}
          onExit={exitSelection}
        />
      ) : null}
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
            showTravelBlocks={
              preferences.data?.showTravelBlocksInMonth ?? false
            }
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onSelectEvent={toggleSelection}
            onCreateDate={canCreate ? quickCreate.fromMonthDay : undefined}
          />
          <section className="md:hidden">
            <h2 className="mb-3 text-section-title font-semibold">
              {selectedDate.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </h2>
            <CalendarAgendaList
              items={visibleItems}
              date={selectedDate}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onSelectEvent={toggleSelection}
            />
          </section>
        </>
      ) : null}
      {view === 'week' ? (
        <WeekCalendar
          date={date}
          items={visibleItems}
          onSelectDate={selectDate}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectEvent={toggleSelection}
          onCreateAt={canCreate ? quickCreate.fromTimeSlot : undefined}
        />
      ) : null}
      {view === 'day' ? (
        <CalendarTimeGrid
          date={date}
          items={visibleItems}
          mode="day"
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectEvent={toggleSelection}
          onCreateAt={canCreate ? quickCreate.fromTimeSlot : undefined}
        />
      ) : null}
      {view === 'agenda' ? (
        <CalendarAgendaList
          items={visibleItems}
          date={date}
          filterDate={false}
          selectionMode={selectionMode}
          selectedIds={selectedIds}
          onSelectEvent={toggleSelection}
        />
      ) : null}
      <CalendarTemplateManagerDialog
        open={templatesOpen}
        onOpenChange={setTemplatesOpen}
        onSelectAppliedEvents={(eventIds) => {
          setSelectionMode(true);
          setSelectedIds(new Set(eventIds));
        }}
      />
      <CalendarBulkEditDialog
        open={bulkEditOpen}
        eventIds={[...selectedIds]}
        members={members.data ?? []}
        onOpenChange={setBulkEditOpen}
        onUpdated={exitSelection}
      />
      <CalendarBulkDeleteDialog
        open={bulkDeleteOpen}
        eventIds={[...selectedIds]}
        onOpenChange={setBulkDeleteOpen}
        onDeleted={exitSelection}
      />
    </div>
  );
}
