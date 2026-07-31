import { useEffect, useState } from 'react';
import { Button } from '../../../../components/ui/Button/Button.js';
import { Dialog } from '../../../../components/ui/Dialog/Dialog.js';
import { InlineAlert } from '../../../../components/ui/InlineAlert/InlineAlert.js';
import { useUploadDocumentImage } from '../../../documents/documents.public.js';
import { useExpeditionMutations } from '../../hooks/useExpeditions.js';
import type { GearInput } from '../../types/expeditions.types.js';
import { GearDocumentField } from './GearDocumentField.js';
import { GearImageFields } from './GearImageFields.js';
import { GearItemDetailsFields } from './GearItemDetailsFields.js';

const initial = (): GearInput => ({
  name: '',
  categoryId: null,
  brand: '',
  model: '',
  description: '',
  notes: '',
  weightGrams: 0,
  weightStatus: 'UNKNOWN',
  defaultLoadType: 'CARRIED',
  defaultCriticality: 'RECOMMENDED',
  ownerUserId: null,
  isHouseholdShared: true,
  defaultQuantity: '1',
  purchaseUrl: '',
  productUrl: '',
  documents: [],
});

export function GearItemDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [value, setValue] = useState(initial);
  const [imageUrl, setImageUrl] = useState('');
  const [attribution, setAttribution] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [createdGearId, setCreatedGearId] = useState<string | null>(null);
  const mutations = useExpeditionMutations();
  const uploadImage = useUploadDocumentImage();
  useEffect(() => {
    if (value.weightGrams > 0 && value.weightStatus === 'UNKNOWN')
      setValue((current) => ({ ...current, weightStatus: 'ESTIMATED' }));
    if (value.weightGrams === 0 && value.weightStatus !== 'UNKNOWN')
      setValue((current) => ({ ...current, weightStatus: 'UNKNOWN' }));
  }, [value.weightGrams, value.weightStatus]);
  const close = () => {
    setValue(initial());
    setImageUrl('');
    setAttribution('');
    setPhotoFile(null);
    setCreatedGearId(null);
    mutations.createGear.reset();
    mutations.importImage.reset();
    uploadImage.reset();
    onOpenChange(false);
  };
  const pending =
    uploadImage.isPending ||
    mutations.createGear.isPending ||
    mutations.importImage.isPending;
  const error =
    uploadImage.error ??
    mutations.createGear.error ??
    mutations.importImage.error;
  const createWithOptionalRemoteImage = (input: GearInput) => {
    mutations.createGear.mutate(input, {
      onSuccess: (gear) => {
        setCreatedGearId(gear.id);
        if (imageUrl.trim())
          mutations.importImage.mutate(
            {
              gearItemId: gear.id,
              input: {
                imageUrl: imageUrl.trim(),
                setAsCover: !photoFile,
                ...(attribution.trim()
                  ? { attribution: attribution.trim() }
                  : {}),
              },
            },
            { onSuccess: close },
          );
        else close();
      },
    });
  };
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title="Nová položka výbavy"
      description="Hmotnost ukládáme v celých gramech. Fotografie zůstávají v Dokumentech."
      size="lg"
      mobileFullScreen
    >
      <form
        className="grid gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (createdGearId && imageUrl.trim()) {
            mutations.importImage.mutate(
              {
                gearItemId: createdGearId,
                input: {
                  imageUrl: imageUrl.trim(),
                  setAsCover: !photoFile,
                  ...(attribution.trim()
                    ? { attribution: attribution.trim() }
                    : {}),
                },
              },
              { onSuccess: close },
            );
            return;
          }
          if (photoFile)
            uploadImage.mutate(
              {
                file: photoFile,
                title: `Fotografie výbavy – ${value.name.trim()}`,
              },
              {
                onSuccess: (document) =>
                  createWithOptionalRemoteImage({
                    ...value,
                    documents: [
                      ...value.documents.filter(
                        ({ relationType }) => relationType !== 'PHOTO',
                      ),
                      {
                        documentId: document.id,
                        relationType: 'PHOTO',
                        isCover: true,
                      },
                    ],
                  }),
              },
            );
          else createWithOptionalRemoteImage(value);
        }}
      >
        <GearItemDetailsFields value={value} setValue={setValue} />
        <GearDocumentField value={value} setValue={setValue} />
        <GearImageFields
          file={photoFile}
          imageUrl={imageUrl}
          attribution={attribution}
          disabled={pending}
          onFile={setPhotoFile}
          onImageUrl={setImageUrl}
          onAttribution={setAttribution}
        />
        {error ? (
          <InlineAlert variant="danger">
            {createdGearId
              ? `Položka výbavy byla vytvořena, ale fotografii se nepodařilo uložit. Opravte adresu a zkuste fotografii znovu: ${error.message}`
              : error.message}
          </InlineAlert>
        ) : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" onClick={close}>
            Zrušit
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={pending}
            disabled={!value.name.trim() || pending}
          >
            {createdGearId ? 'Zkusit fotografii znovu' : 'Přidat výbavu'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
