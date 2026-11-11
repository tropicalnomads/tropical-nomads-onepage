'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { saveArtistAction } from '../../admin/artist-actions';
import type { ArtistProfile } from '../../artists/profile';
import { artistCropSize } from '../../shop/crop-image';
import { adminText } from '../../i18n/copy';
import { useLanguage } from '../../i18n/provider';
import { CroppedImageField } from './CroppedImageField';
import { adminFieldClass } from './form';
import { MarkdownField } from './MarkdownField';
import { Button, TextLink } from '../ui/Button';

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
  const [genres, setGenres] = useState(artist?.genres.join(', ') ?? '');
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
    setGenres(artist?.genres.join(', ') ?? '');
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
    data.set('name', name);
    data.set('country', country);
    data.set('genres', genres);
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
      country: country.trim(),
      genres: genres
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item !== ''),
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
        onClose();
      }}
      className="m-auto max-h-[90vh] w-[min(94vw,52rem)] overflow-y-auto rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
    >
      <form onSubmit={onSubmit} className="grid gap-6 p-5 md:grid-cols-[16rem_1fr] md:p-7">
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
          <div className="flex items-start justify-between gap-3">
            <h2 className="font-display text-2xl font-bold">{adminText(language, 'artistProfile')}</h2>
            <TextLink onClick={onClose}>{adminText(language, 'cancel')}</TextLink>
          </div>
          <label className="block text-sm font-bold">
            {adminText(language, 'artistName')}
            <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} className={`${adminFieldClass} mt-2`} />
          </label>
          <label className="block text-sm font-bold">
            {adminText(language, 'country')}
            <input maxLength={80} value={country} onChange={(event) => setCountry(event.target.value)} className={`${adminFieldClass} mt-2`} />
          </label>
          <label className="block text-sm font-bold">
            {adminText(language, 'genres')}
            <input value={genres} onChange={(event) => setGenres(event.target.value)} className={`${adminFieldClass} mt-2`} />
          </label>
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
          {error ? <p className="text-sm font-semibold text-ozora-coral">{error}</p> : null}
          <Button type="submit" disabled={pending}>
            {pending ? adminText(language, 'saving') : adminText(language, 'saveArtist')}
          </Button>
        </div>
      </form>
    </dialog>,
    document.body,
  );
}
