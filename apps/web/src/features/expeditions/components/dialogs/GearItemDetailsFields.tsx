import type { Dispatch, SetStateAction } from 'react';
import { Input } from '../../../../components/ui/Input/Input.js';
import { Select } from '../../../../components/ui/Select/Select.js';
import { Textarea } from '../../../../components/ui/Textarea/Textarea.js';
import { useHouseholdMembers } from '../../../household/household.public.js';
import { useGearCategories } from '../../hooks/useExpeditions.js';
import {
  CRITICALITY_LABELS,
  LOAD_TYPE_LABELS,
} from '../../lib/expeditionLabels.js';
import type {
  GearCriticality,
  GearInput,
  GearLoadType,
  GearWeightStatus,
} from '../../types/expeditions.types.js';

export function GearItemDetailsFields({
  value,
  setValue,
}: {
  value: GearInput;
  setValue: Dispatch<SetStateAction<GearInput>>;
}) {
  const categories = useGearCategories();
  const members = useHouseholdMembers();
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Název"
          required
          value={value.name}
          onChange={(event) =>
            setValue((current) => ({ ...current, name: event.target.value }))
          }
        />
        <Select
          label="Kategorie"
          value={value.categoryId ?? ''}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              categoryId: event.target.value || null,
            }))
          }
        >
          <option value="">Bez kategorie</option>
          {(categories.data ?? []).map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Input
          label="Značka"
          value={value.brand}
          onChange={(event) =>
            setValue((current) => ({ ...current, brand: event.target.value }))
          }
        />
        <Input
          label="Model"
          value={value.model}
          onChange={(event) =>
            setValue((current) => ({ ...current, model: event.target.value }))
          }
        />
        <Input
          label="Hmotnost v gramech"
          type="number"
          min={0}
          max={1_000_000}
          value={value.weightGrams}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              weightGrams: Number(event.target.value),
            }))
          }
          {...(value.weightStatus === 'UNKNOWN'
            ? { hint: 'Hmotnost zatím není ověřená.' }
            : {})}
        />
        <Select
          label="Stav hmotnosti"
          value={value.weightStatus}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              weightStatus: event.target.value as GearWeightStatus,
            }))
          }
        >
          <option value="UNKNOWN">Neznámá</option>
          <option value="ESTIMATED">Odhadnutá</option>
          <option value="VERIFIED">Ověřená</option>
        </Select>
        <Select
          label="Výchozí typ zatížení"
          value={value.defaultLoadType}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              defaultLoadType: event.target.value as GearLoadType,
            }))
          }
        >
          {Object.entries(LOAD_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Kritičnost"
          value={value.defaultCriticality}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              defaultCriticality: event.target.value as GearCriticality,
            }))
          }
        >
          {Object.entries(CRITICALITY_LABELS).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </Select>
        <Select
          label="Vlastník"
          value={value.ownerUserId ?? ''}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              ownerUserId: event.target.value || null,
            }))
          }
        >
          <option value="">Společná výbava</option>
          {(members.data ?? []).map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName ?? member.email}
            </option>
          ))}
        </Select>
        <Input
          label="Výchozí množství"
          inputMode="decimal"
          pattern="(?:0|[1-9]\d*)(?:\.\d{1,3})?"
          value={value.defaultQuantity}
          onChange={(event) =>
            setValue((current) => ({
              ...current,
              defaultQuantity: event.target.value,
            }))
          }
        />
      </div>
      <Textarea
        label="Popis"
        value={value.description}
        onChange={(event) =>
          setValue((current) => ({
            ...current,
            description: event.target.value,
          }))
        }
      />
    </>
  );
}
