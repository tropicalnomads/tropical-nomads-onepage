'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { saveArtistAction } from '../../admin/artist-actions';
import { artistGenreLimit, genreChoices, toggleArtistGenre } from '../../artists/genres';
import type { ArtistProfile } from '../../artists/profile';
import { artistCropSize } from '../../shop/crop-image';
import { adminText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { canonicalCountryName, countryCodeFromInput } from '../../shop/postal';
import { CroppedImageField } from './CroppedImageField';
import { adminFieldClass } from './form';
import { MarkdownField } from './MarkdownField';
import { Button, TextLink } from '../ui/Button';
import { CountrySelect } from '../ui/CountrySelect';

export function ArtistEditor({
  artist,
  open,
  onClose,
  onSaved,
}: {
  artist?: ArtistProfile;
  open: boolean;
  onClose: () => void;
  onSaved: (artist: ArtistProfile) => void;
}) {
  const { language } = useLanguage();
  const [name, setName] = useState(artist?.name ?? '');
  const [country, setCountry] = useState(artist?.country ?? '');
  const [genres, setGenres] = useState<string[]>(artist?.genres ?? []);
  const [bio, setBio] = useState(artist?.bio ?? '');
  const [soundcloud, setSoundcloud] = useState(artist?.soundcloud ?? '');
  const [instagram, setInstagram] = useState(artist?.instagram ?? '');
  const [website, setWebsite] = useState(artist?.website ?? '');
  const [preview, setPreview] = useState<string | undefined>(artist?.photo);
  const [imageFile, setImageFile] = useState<File>();
  const [imageRemoved, setImageRemoved] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setName(artist?.name ?? '');
    setCountry(artist?.country ?? '');
    setGenres(artist?.genres ?? []);
    setBio(artist?.bio ?? '');
    setSoundcloud(artist?.soundcloud ?? '');
    setInstagram(artist?.instagram ?? '');
    setWebsite(artist?.website ?? '');
    setPreview(artist?.photo);
    setImageFile(undefined);
    setImageRemoved(false);
    setError('');
  }, [artist, open]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) {
      dialog.showModal();
    }
    if (!open && dialog?.open) {
      dialog.close();
    }
  }, [open]);

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError('');
    const data = new FormData();
    if (artist?.id) {
      data.set('id', artist.id);
    }
    const countryName = canonicalCountryName(country.trim());
    const isoCountry = countryCodeFromInput(countryName) ?? '';
    data.set('name', name);
    data.set('country', countryName);
    data.set('isoCountry', isoCountry);
    data.set('genres', genres.join(', '));
    data.set('bio', bio);
    data.set('soundcloud', soundcloud);
    data.set('instagram', instagram);
    data.set('website', website);
    data.set('imageAction', imageRemoved ? 'remove' : 'keep');
    if (imageFile) {
      data.set('image', imageFile);
    }
    const saved = await saveArtistAction(data);
    setPending(false);
    if (saved.notice !== 'saved') {
      setError(adminText(language, 'artistInvalid'));
      return;
    }
    onSaved({
      id: saved.id,
      name: name.trim(),
      country: countryName,
      ...(isoCountry ? { isoCountry, flag: isoCountry } : {}),
      genres,
      bio: bio.trim(),
      soundcloud: soundcloud.trim(),
      instagram: instagram.trim(),
      website: website.trim(),
      ...(imageRemoved ? {} : { photo: imageFile ? `/artists/media/${saved.id}` : artist?.photo }),
    });
    onClose();
  }

  if (!mounted || !open) {
    return null;
  }

  return createPortal(
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        if (document.querySelector(':popover-open')) {
          return;
        }
        onClose();
      }}
      className="!inset-x-auto !bottom-auto !top-0 !m-auto !h-dvh !max-h-dvh !w-full !max-w-[1600px] !overflow-hidden !rounded-none !border-0 !p-0 bg-ozora-navy text-ozora-cream backdrop:bg-black/80"
    >
      <form onSubmit={onSubmit} className="flex h-full min-h-0 flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-white/10 px-5 py-4 md:px-7">
          <h2 className="font-display text-2xl font-bold">{adminText(language, 'artistProfile')}</h2>
          <TextLink onClick={onClose}>{adminText(language, 'cancel')}</TextLink>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="grid gap-6 p-5 md:grid-cols-[16rem_1fr] md:p-7">
            <CroppedImageField
              preview={preview}
              aspect={1}
              aspectClass="aspect-square"
              output={artistCropSize}
              fileName="artist.webp"
              labels={{
                title: adminText(language, 'artistPhoto'),
                ratio: adminText(language, 'artistPhotoRatio'),
                remove: adminText(language, 'removeImage'),
                noImage: adminText(language, 'artistNoPhoto'),
                placeholder: adminText(language, 'artistPhotoPlaceholder'),
                replace: adminText(language, 'replaceImage'),
                upload: adminText(language, 'uploadImage'),
                help: adminText(language, 'artistPhotoHelp'),
                invalid: adminText(language, 'imageInvalid'),
                cropTitle: adminText(language, 'artistCrop'),
                cropHelp: adminText(language, 'artistCropHelp'),
                cancel: adminText(language, 'cancel'),
                zoom: adminText(language, 'zoom'),
                cropping: adminText(language, 'croppingImage'),
                use: adminText(language, 'useImage'),
              }}
              onChange={(next) => {
                setPreview(next.preview);
                setImageFile(next.file);
                setImageRemoved(next.removed);
              }}
            />
            <div className="space-y-4">
              <label className="block text-sm font-bold">
                {adminText(language, 'artistName')}
                <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className={`${adminFieldClass} mt-2`} />
              </label>
              <label className="block text-sm font-bold">
                {adminText(language, 'country')}
                <div className="mt-2">
                  <CountrySelect
                    ariaLabel={adminText(language, 'country')}
                    value={country}
                    placeholder={adminText(language, 'country')}
                    searchPlaceholder={adminText(language, 'searchCountry')}
                    emptyLabel={adminText(language, 'noCountry')}
                    onChange={setCountry}
                  />
                </div>
              </label>
              <div role="group" aria-label={adminText(language, 'genres')}>
                <p className="text-sm font-bold">{adminText(language, 'genres')}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {genreChoices(genres).map((genre) => {
                    const selected = genres.includes(genre);
                    return (
                      <button
                        key={genre}
                        type="button"
                        aria-pressed={selected}
                        disabled={!selected && genres.length >= artistGenreLimit}
                        onClick={() => setGenres((current) => toggleArtistGenre(current, genre))}
                        className={`rounded-full border px-3 py-1.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-40 ${selected ? 'border-ozora-yellow bg-ozora-yellow text-ozora-ink' : 'border-white/15 text-ozora-cream hover:border-ozora-turquoise/50'}`}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>
              <MarkdownField
                id="artist-bio"
                name="bio"
                value={bio}
                maxLength={4000}
                rows={5}
                label={adminText(language, 'artistBio')}
                boldLabel={adminText(language, 'boldText')}
                italicLabel={adminText(language, 'italicText')}
                help={adminText(language, 'markdownHelp')}
                previewLabel={adminText(language, 'preview')}
                onChange={setBio}
              />
              <label className="block text-sm font-bold">
                {adminText(language, 'soundcloud')}
                <input value={soundcloud} onChange={(event) => setSoundcloud(event.target.value)} placeholder="https://soundcloud.com/" className={`${adminFieldClass} mt-2`} />
              </label>
              <label className="block text-sm font-bold">
                {adminText(language, 'instagram')}
                <input value={instagram} onChange={(event) => setInstagram(event.target.value)} placeholder="https://instagram.com/" className={`${adminFieldClass} mt-2`} />
              </label>
              <label className="block text-sm font-bold">
                {adminText(language, 'website')}
                <input value={website} onChange={(event) => setWebsite(event.target.value)} placeholder="https://" className={`${adminFieldClass} mt-2`} />
              </label>
            </div>
          </div>
        </div>
        <footer className="flex shrink-0 items-center justify-end gap-4 border-t border-white/10 px-5 py-4 md:px-7">
          {error ? <p className="mr-auto text-sm font-semibold text-ozora-coral">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? adminText(language, 'saving') : adminText(language, 'saveArtist')}
          </Button>
        </footer>
      </form>
    </dialog>,
    document.body,
  );
}
