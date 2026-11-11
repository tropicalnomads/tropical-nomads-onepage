'use client';

import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import { avatarByteLimit } from 'tropical-nomads-shared';
import 'react-easy-crop/react-easy-crop.css';
import { croppedImage } from '../../shop/crop-image';

const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];

export interface CroppedImageLabels {
  title: string;
  ratio: string;
  remove: string;
  noImage: string;
  placeholder: string;
  replace: string;
  upload: string;
  help: string;
  invalid: string;
  cropTitle: string;
  cropHelp: string;
  cancel: string;
  zoom: string;
  cropping: string;
  use: string;
}

export interface CroppedImageChange {
  preview?: string;
  file?: File;
  removed: boolean;
}

type CroppedImagePresentation = 'panel' | 'avatar';
type CroppedImageCropShape = 'rect' | 'round';

export function CroppedImageField({
  preview,
  aspect,
  aspectClass,
  output,
  fileName,
  labels,
  disabled = false,
  presentation = 'panel',
  cropShape = 'rect',
  onInvalid,
  onChange,
}: {
  preview?: string;
  aspect: number;
  aspectClass: string;
  output: { width: number; height: number };
  fileName: string;
  labels: CroppedImageLabels;
  disabled?: boolean;
  presentation?: CroppedImagePresentation;
  cropShape?: CroppedImageCropShape;
  onInvalid?: (reason: 'too-large' | 'invalid') => void;
  onChange: (next: CroppedImageChange) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [imageError, setImageError] = useState('');
  const [cropSource, setCropSource] = useState<string>();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area>();
  const [cropping, setCropping] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cropObjectUrlRef = useRef<string | undefined>(undefined);
  const previewObjectUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (cropSource && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [cropSource]);

  useEffect(
    () => () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      if (cropObjectUrlRef.current) {
        URL.revokeObjectURL(cropObjectUrlRef.current);
      }
    },
    [],
  );

  function closeCrop(): void {
    if (cropObjectUrlRef.current) {
      URL.revokeObjectURL(cropObjectUrlRef.current);
      cropObjectUrlRef.current = undefined;
    }
    setCropSource(undefined);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCropPixels(undefined);
    dialogRef.current?.close();
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  function chooseImage(event: ChangeEvent<HTMLInputElement>): void {
    const file = event.target.files?.[0];
    setImageError('');
    if (!file || disabled) {
      return;
    }
    if (file.size > avatarByteLimit) {
      setImageError(labels.invalid);
      onInvalid?.('too-large');
      event.target.value = '';
      return;
    }
    if (!imageTypes.includes(file.type)) {
      setImageError(labels.invalid);
      onInvalid?.('invalid');
      event.target.value = '';
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    cropObjectUrlRef.current = objectUrl;
    setCropSource(objectUrl);
  }

  async function useCrop(): Promise<void> {
    if (!cropSource || !cropPixels) {
      return;
    }
    setCropping(true);
    setImageError('');
    try {
      const file = await croppedImage(cropSource, cropPixels, output, fileName);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      onChange({ preview: objectUrl, file, removed: false });
      closeCrop();
    } catch {
      setImageError(labels.invalid);
    } finally {
      setCropping(false);
    }
  }

  function removeImage(): void {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = undefined;
    }
    setImageError('');
    if (fileRef.current) {
      fileRef.current.value = '';
    }
    onChange({ preview: undefined, file: undefined, removed: true });
  }

  let dialogClassName: string;
  let cropStageClassName: string;
  switch (cropShape) {
    case 'rect':
      dialogClassName =
        'm-auto w-[min(92vw,42rem)] rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80';
      cropStageClassName = `relative mt-5 max-h-[58vh] overflow-hidden rounded-2xl bg-black/40 ${aspectClass}`;
      break;
    case 'round':
      dialogClassName =
        'm-auto w-[min(92vw,28rem)] rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80';
      cropStageClassName = 'relative mx-auto mt-5 h-72 w-72 aspect-square overflow-hidden rounded-full bg-black/40';
      break;
    default: {
      const exhaustiveCropShape: never = cropShape;
      throw new Error(`Unsupported crop shape: ${exhaustiveCropShape}`);
    }
  }

  const cropDialog: ReactNode = (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        closeCrop();
      }}
      className={dialogClassName}
    >
      <div className="p-5 md:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold">{labels.cropTitle}</h2>
            <p className="mt-1 text-sm text-ozora-cream/55">{labels.cropHelp}</p>
          </div>
          <button type="button" onClick={closeCrop} className="rounded-full px-3 py-2 text-sm font-bold text-ozora-cream/60 hover:bg-white/10">
            {labels.cancel}
          </button>
        </div>
        <div className={cropStageClassName}>
          {cropSource ? (
            <Cropper
              image={cropSource}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_area, pixels) => setCropPixels(pixels)}
            />
          ) : null}
        </div>
        <label className="mt-5 block">
          <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
            {labels.zoom}
            <span className="tabular-nums">{zoom.toFixed(1)}×</span>
          </span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="mt-3 w-full accent-ozora-yellow"
          />
        </label>
        {imageError ? <p className="mt-3 text-sm font-semibold text-ozora-coral">{imageError}</p> : null}
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={closeCrop} className="h-11 rounded-full border border-white/15 px-5 text-sm font-bold hover:bg-white/10">
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={useCrop}
            disabled={cropping || !cropPixels}
            className="h-11 rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:opacity-40"
          >
            {cropping ? labels.cropping : labels.use}
          </button>
        </div>
      </div>
    </dialog>
  );

  const fileInput: ReactNode = (
    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={chooseImage} className="sr-only" tabIndex={-1} />
  );

  let field: ReactNode;
  switch (presentation) {
    case 'panel':
      field = (
        <section className="lg:sticky lg:top-6">
          <div className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-sm font-bold text-ozora-cream">{labels.title}</h2>
                <p className="mt-0.5 text-xs text-ozora-cream/45">{labels.ratio}</p>
              </div>
              {preview ? (
                <button
                  type="button"
                  onClick={removeImage}
                  disabled={disabled}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-ozora-coral/35 px-3 text-xs font-bold text-ozora-coral transition hover:bg-ozora-coral/10 disabled:opacity-40"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  {labels.remove}
                </button>
              ) : null}
            </div>
            <div className={`relative flex overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20 ${aspectClass}`}>
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex w-full flex-col items-center justify-center border-2 border-dashed border-white/10 px-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05] text-ozora-cream/45">
                    <ImagePlus size={28} aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-bold text-ozora-cream">{labels.noImage}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ozora-cream/45">{labels.placeholder}</p>
                </div>
              )}
            </div>
            {fileInput}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-ozora-cream transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:opacity-40"
            >
              <Upload size={17} aria-hidden="true" />
              {preview ? labels.replace : labels.upload}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-ozora-cream/45">{labels.help}</p>
            {imageError ? <p className="mt-2 text-center text-sm font-semibold text-ozora-coral">{imageError}</p> : null}
          </div>
        </section>
      );
      break;
    case 'avatar':
      field = (
        <div className="flex w-24 shrink-0 flex-col items-center gap-3">
          <div className="relative h-24 w-24">
            <div className="h-24 w-24 overflow-hidden rounded-full border border-white/15 bg-black/25">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-ozora-cream/40">
                  <ImagePlus size={26} aria-hidden="true" />
                </div>
              )}
            </div>
            {fileInput}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={disabled}
              aria-label={preview ? labels.replace : labels.upload}
              title={labels.placeholder}
              className="absolute bottom-1 right-1 inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-ozora-navy bg-ozora-yellow text-ozora-ink shadow-lg transition hover:bg-ozora-coral focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-yellow disabled:opacity-40"
            >
              <Camera size={15} aria-hidden="true" />
            </button>
            {preview ? (
              <button
                type="button"
                onClick={removeImage}
                disabled={disabled}
                aria-label={labels.remove}
                title={labels.remove}
                className="absolute -right-1 -top-1 inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/15 bg-ozora-navy text-ozora-coral shadow-lg transition hover:bg-ozora-coral/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-coral disabled:opacity-40"
              >
                <Trash2 size={13} aria-hidden="true" />
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={disabled}
            className="text-xs font-bold text-ozora-turquoise underline-offset-4 transition hover:text-ozora-yellow hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise disabled:opacity-40"
          >
            {preview ? labels.replace : labels.upload}
          </button>
          {imageError ? <p className="w-28 text-center text-xs font-semibold leading-relaxed text-ozora-coral">{imageError}</p> : null}
        </div>
      );
      break;
    default: {
      const exhaustivePresentation: never = presentation;
      throw new Error(`Unsupported presentation: ${exhaustivePresentation}`);
    }
  }

  return (
    <>
      {field}
      {mounted && cropSource ? createPortal(cropDialog, document.body) : null}
    </>
  );
}
