import { Avatar } from '../../../components/ui/Avatar/Avatar.js';
import { Badge } from '../../../components/ui/Badge/Badge.js';
import { InlineAlert } from '../../../components/ui/InlineAlert/InlineAlert.js';
import { Spinner } from '../../../components/ui/Spinner/Spinner.js';
import { useCurrentUser } from '../../auth/hooks/useCurrentUser.js';
import {
  useHouseholdMembers,
  useUpdateMemberCalendarColor,
} from '../hooks/useHouseholdMembers.js';
import { MemberCalendarColorPicker } from './MemberCalendarColorPicker.js';

const roles = {
  OWNER: 'Vlastník',
  ADMIN: 'Správce',
  MEMBER: 'Člen',
  VIEWER: 'Čtenář',
} as const;

export function HouseholdMembersPanel() {
  const members = useHouseholdMembers();
  const current = useCurrentUser();
  const updateColor = useUpdateMemberCalendarColor();
  return (
    <section
      className="rounded-lg border border-border bg-surface-raised p-5"
      aria-labelledby="household-members-title"
    >
      <h2
        id="household-members-title"
        className="text-section-title font-semibold"
      >
        Členové domácnosti
      </h2>
      <p className="mt-2 text-body-sm text-text-muted">
        Přístup členů se v této verzi nastavuje v konfiguraci serveru.
      </p>
      {members.isPending ? (
        <div className="mt-5 flex items-center gap-2 text-body-sm text-text-muted">
          <Spinner /> Načítáme členy…
        </div>
      ) : null}
      {members.isError ? (
        <div className="mt-4">
          <InlineAlert variant="danger">
            Členy domácnosti se nepodařilo načíst.
          </InlineAlert>
        </div>
      ) : null}
      {members.data ? (
        <ul className="mt-4 divide-y divide-border">
          {members.data.map((member) => (
            <li
              key={member.id}
              className="flex min-h-16 flex-wrap items-center gap-3 py-3"
            >
              <Avatar
                imageUrl={member.avatarUrl}
                name={member.displayName ?? member.email}
                size="sm"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-text">
                  {member.displayName ?? member.email}
                </p>
                <p className="truncate text-caption text-text-muted">
                  {member.email}
                </p>
              </div>
              <Badge>{roles[member.role]}</Badge>
              <MemberCalendarColorPicker
                name={`calendar-color-${member.id}`}
                value={member.calendarColorToken ?? 'violet'}
                disabled={
                  updateColor.isPending ||
                  (member.id !== current.data?.user.id &&
                    current.data?.activeHousehold.role !== 'OWNER' &&
                    current.data?.activeHousehold.role !== 'ADMIN')
                }
                onChange={(calendarColorToken) =>
                  updateColor.mutate({
                    userId: member.id,
                    calendarColorToken,
                  })
                }
              />
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
