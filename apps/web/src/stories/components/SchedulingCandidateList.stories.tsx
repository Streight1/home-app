import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { SchedulingCandidateList } from '../../features/scheduling/components/SchedulingCandidateList.js';
import type { SchedulingCandidate } from '../../features/scheduling/types/scheduling.types.js';

const candidates: SchedulingCandidate[] = [
  {
    startAt: '2030-07-15T07:00:00.000Z',
    endAt: '2030-07-15T08:00:00.000Z',
    status: 'FEASIBLE',
    participantTravel: [
      {
        userId: '10000000-0000-4000-8000-000000000001',
        displayName: 'Jana Nováková',
        travelBeforeMinutes: 18,
        departureAt: '2030-07-15T06:32:00.000Z',
        travelAfterMinutes: 12,
        warnings: [],
      },
      {
        userId: '10000000-0000-4000-8000-000000000002',
        displayName: 'Petr Novák',
        travelBeforeMinutes: 24,
        departureAt: '2030-07-15T06:26:00.000Z',
        travelAfterMinutes: null,
        warnings: [],
      },
    ],
    totalTravelMinutes: 54,
    warnings: [],
    candidateToken: 'synthetic-candidate-one',
  },
  {
    startAt: '2030-07-15T14:00:00.000Z',
    endAt: '2030-07-15T15:00:00.000Z',
    status: 'FEASIBLE_WITH_WARNINGS',
    participantTravel: [
      {
        userId: '10000000-0000-4000-8000-000000000001',
        displayName: 'Jana Nováková',
        travelBeforeMinutes: null,
        departureAt: null,
        travelAfterMinutes: null,
        warnings: ['TRAVEL_ORIGIN_UNKNOWN'],
      },
    ],
    totalTravelMinutes: 0,
    warnings: ['TRAVEL_ORIGIN_UNKNOWN'],
    candidateToken: 'synthetic-candidate-two',
  },
  {
    startAt: '2030-07-15T18:00:00.000Z',
    endAt: '2030-07-15T19:00:00.000Z',
    status: 'TRAVEL_NOT_VERIFIED',
    participantTravel: [],
    totalTravelMinutes: 0,
    warnings: ['ROUTING_UNAVAILABLE'],
    candidateToken: 'synthetic-candidate-three',
  },
];

function CandidateFixture() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="mx-auto w-full max-w-2xl rounded-lg bg-surface-raised p-6">
      <SchedulingCandidateList
        result={{
          task: {
            id: '30000000-0000-4000-8000-000000000001',
            title: 'Společný nákup',
            durationMinutes: 60,
            participants: [],
          },
          candidates,
          diagnostics: {
            summary: {
              freeIntervalsFound: 2,
              timeCandidatesGenerated: 8,
              travelCandidatesEvaluated: 8,
              feasibleCandidates: 2,
            },
            rejections: [],
            freeIntervals: [
              {
                startAt: '2030-07-15T06:00:00.000Z',
                endAt: '2030-07-15T08:00:00.000Z',
                durationMinutes: 120,
              },
              {
                startAt: '2030-07-15T13:00:00.000Z',
                endAt: '2030-07-15T16:00:00.000Z',
                durationMinutes: 180,
              },
            ],
            longestFreeIntervalMinutes: 180,
            effectiveWindow: {
              startAt: '2030-07-15T06:00:00.000Z',
              endAt: '2030-07-15T22:00:00.000Z',
            },
          },
        }}
        selectedToken={selected}
        onSelect={setSelected}
        onWithoutTravel={() => undefined}
        onTomorrow={() => undefined}
        onExpandWindow={() => undefined}
      />
    </div>
  );
}

function DiagnosticsFixture() {
  return (
    <div className="mx-auto w-full max-w-5xl rounded-lg bg-surface-raised p-6">
      <SchedulingCandidateList
        result={{
          task: {
            id: '30000000-0000-4000-8000-000000000001',
            title: 'Společný nákup',
            durationMinutes: 60,
            participants: [],
          },
          candidates: [],
          diagnostics: {
            summary: {
              freeIntervalsFound: 2,
              timeCandidatesGenerated: 6,
              travelCandidatesEvaluated: 6,
              feasibleCandidates: 0,
            },
            rejections: [
              { code: 'NOT_ENOUGH_TIME_BEFORE_NEXT_EVENT', count: 4 },
              { code: 'NOT_ENOUGH_TIME_AFTER_PREVIOUS_EVENT', count: 2 },
            ],
            freeIntervals: [
              {
                startAt: '2030-07-15T04:00:00.000Z',
                endAt: '2030-07-15T06:00:00.000Z',
                durationMinutes: 120,
              },
              {
                startAt: '2030-07-15T18:00:00.000Z',
                endAt: '2030-07-15T20:00:00.000Z',
                durationMinutes: 120,
              },
            ],
            longestFreeIntervalMinutes: 120,
            effectiveWindow: {
              startAt: '2030-07-15T04:00:00.000Z',
              endAt: '2030-07-15T20:00:00.000Z',
            },
          },
        }}
        selectedToken={null}
        onSelect={() => undefined}
        onWithoutTravel={() => undefined}
        onTomorrow={() => undefined}
        onExpandWindow={() => undefined}
      />
    </div>
  );
}

const meta = {
  title: 'Features/Scheduling/CandidateList',
  component: CandidateFixture,
} satisfies Meta<typeof CandidateFixture>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dark: Story = { parameters: { theme: 'dark' } };
export const Light: Story = { parameters: { theme: 'light' } };
export const DiagnosticsDark: Story = {
  parameters: { theme: 'dark' },
  render: () => <DiagnosticsFixture />,
};
export const DiagnosticsLight: Story = {
  parameters: { theme: 'light' },
  render: () => <DiagnosticsFixture />,
};
