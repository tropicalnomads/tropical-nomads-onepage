'use client';

import { AlertTriangle, ArrowLeft, Bold, CheckCircle2, Eye, EyeOff, ImagePlus, Italic, PackageOpen, Plus, Store, Trash2, Upload } from 'lucide-react';
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { deleteShopProductAction, saveShopProductAction, type ShopDeleteNotice, type ShopProductNotice } from '../admin/shop-actions';
import { shopSizeCodes, type ShopProductValues } from '../admin/shop-values';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { croppedShopImage } from '../shop/crop-image';
import { ShopMarkdown } from '../shop/markdown';
import { ShopImagePlaceholder } from './ShopImagePlaceholder';

const fieldClass =
  'w-full rounded-2xl border border-white/15 bg-black/25 px-4 py-3 text-base text-ozora-cream outline-none transition placeholder:text-ozora-cream/30 focus:border-ozora-turquoise focus:ring-2 focus:ring-ozora-turquoise/15';
const imageTypes = ['image/jpeg', 'image/png', 'image/webp'];

interface ProductReview {
  name: string;
  description: string;
  amount: string;
  stock: { label: string; count: string }[];
  hidden: boolean;
}

export function AdminShopForm({ values }: { values: ShopProductValues }) {
  const { language } = useLanguage();
  const [result, setResult] = useState<ShopProductNotice | null>(null);
  const [pending, setPending] = useState(false);
  const [description, setDescription] = useState(values.description);
  const [preview, setPreview] = useState<string | undefined>(values.image);
  const [imageFile, setImageFile] = useState<File>();
  const [imageRemoved, setImageRemoved] = useState(false);
  const [imageError, setImageError] = useState('');
  const [cropSource, setCropSource] = useState<string>();
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [cropPixels, setCropPixels] = useState<Area>();
  const [cropping, setCropping] = useState(false);
  const [hidden, setHidden] = useState(values.hidden);
  const [review, setReview] = useState<ProductReview>();
  const [savedProduct, setSavedProduct] = useState<{ id: string; created: boolean }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<ShopDeleteNotice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const cropObjectUrlRef = useRef<string | undefined>(undefined);
  const previewObjectUrlRef = useRef<string | undefined>(undefined);
  const creating = values.id === '';

  useEffect(() => {
    const dialog = dialogRef.current;
    if (cropSource && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [cropSource]);

  useEffect(() => {
    const dialog = reviewDialogRef.current;
    if (review && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!review && dialog?.open) {
      dialog.close();
    }
  }, [review]);

  useEffect(() => {
    const dialog = successDialogRef.current;
    if (savedProduct && dialog && !dialog.open) {
      dialog.showModal();
    }
  }, [savedProduct]);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (deleteOpen && dialog && !dialog.open) {
      dialog.showModal();
    } else if (!deleteOpen && dialog?.open) {
      dialog.close();
    }
  }, [deleteOpen]);

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
    if (!file) {
      return;
    }
    if (!imageTypes.includes(file.type) || file.size > 5_000_000) {
      setImageError(shopText(language, 'imageInvalid'));
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
      const file = await croppedShopImage(cropSource, cropPixels);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
      const objectUrl = URL.createObjectURL(file);
      previewObjectUrlRef.current = objectUrl;
      setImageFile(file);
      setPreview(objectUrl);
      setImageRemoved(false);
      closeCrop();
    } catch {
      setImageError(shopText(language, 'imageInvalid'));
    } finally {
      setCropping(false);
    }
  }

  function removeImage(): void {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = undefined;
    }
    setPreview(undefined);
    setImageFile(undefined);
    setImageRemoved(true);
    setImageError('');
    if (fileRef.current) {
      fileRef.current.value = '';
    }
  }

  function formatDescription(marker: '*' | '**'): void {
    const textarea = descriptionRef.current;
    if (!textarea) {
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = description.slice(start, end);
    const next = `${description.slice(0, start)}${marker}${selected}${marker}${description.slice(end)}`.slice(0, 1000);
    setDescription(next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + marker.length, start + marker.length + selected.length);
    });
  }

  function productFormData(): FormData | undefined {
    if (!formRef.current) {
      return undefined;
    }
    const formData = new FormData(formRef.current);
    formData.set('hidden', hidden ? 'true' : 'false');
    formData.set('imageAction', imageRemoved ? 'remove' : 'keep');
    if (imageFile) {
      formData.set('image', imageFile);
    }
    return formData;
  }

  function onSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const formData = productFormData();
    if (!formData) {
      return;
    }
    setResult(null);
    setReview({
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      amount: String(formData.get('amount') ?? ''),
      stock: shopSizeCodes.map((code) => ({ label: sizeLabel(code, language), count: String(formData.get(`stock-${code}`) ?? '0') })),
      hidden,
    });
  }

  async function commitSave(): Promise<void> {
    const formData = productFormData();
    if (!formData) {
      return;
    }
    setPending(true);
    setResult(null);
    setReview(undefined);
    try {
      const saved = await saveShopProductAction(formData);
      setResult(saved);
      if (saved.notice === 'saved') {
        setSavedProduct({ id: saved.id, created: creating });
      }
    } catch {
      setResult({ notice: 'invalid' });
    }
    setPending(false);
  }

  async function deleteProduct(): Promise<void> {
    if (!values.id) {
      return;
    }
    setDeleting(true);
    setDeleteResult(null);
    const deleted = await deleteShopProductAction(values.id);
    setDeleteResult(deleted);
    if (deleted.notice === 'deleted') {
      window.location.assign('/admin/shop');
      return;
    }
    setDeleting(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-1">
      <a
        href="/shop"
        className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 px-4 text-sm font-bold text-ozora-cream transition hover:border-ozora-turquoise/60 hover:bg-white/5"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {shopText(language, 'backShop')}
      </a>
      <div className="mt-5">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-ozora-yellow">{shopText(language, 'productDetails')}</p>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-ozora-cream md:text-4xl">
          {shopText(language, creating ? 'addProduct' : 'editProduct')}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ozora-cream/60">{shopText(language, 'editorIntro')}</p>
      </div>

      <form ref={formRef} onSubmit={onSubmit} className="mt-8 grid gap-8 lg:grid-cols-[minmax(18rem,23rem)_minmax(0,1fr)] lg:items-start">
        {values.id ? <input type="hidden" name="id" value={values.id} /> : null}
        <input type="hidden" name="hidden" value={hidden ? 'true' : 'false'} />

        <section className="lg:sticky lg:top-6">
          <div className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-4 shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div>
                <h2 className="text-sm font-bold text-ozora-cream">{shopText(language, 'productImage')}</h2>
                <p className="mt-0.5 text-xs text-ozora-cream/45">{shopText(language, 'imageRatio')}</p>
              </div>
              {preview ? (
                <button
                  type="button"
                  onClick={removeImage}
                  className="inline-flex h-9 items-center gap-2 rounded-full border border-ozora-coral/35 px-3 text-xs font-bold text-ozora-coral transition hover:bg-ozora-coral/10"
                >
                  <Trash2 size={14} aria-hidden="true" />
                  {shopText(language, 'removeImage')}
                </button>
              ) : null}
            </div>

            <div className="relative flex aspect-[4/5] overflow-hidden rounded-[1.5rem] border border-white/10 bg-black/20">
              {preview ? (
                <img src={preview} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex w-full flex-col items-center justify-center border-2 border-dashed border-white/10 px-8 text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/[0.05] text-ozora-cream/45">
                    <ImagePlus size={28} aria-hidden="true" />
                  </span>
                  <p className="mt-4 font-bold text-ozora-cream">{shopText(language, 'noImage')}</p>
                  <p className="mt-1 text-xs leading-relaxed text-ozora-cream/45">{shopText(language, 'imagePlaceholder')}</p>
                </div>
              )}
            </div>

            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseImage} className="sr-only" tabIndex={-1} />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white/10 px-5 text-sm font-bold text-ozora-cream transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ozora-turquoise"
            >
              <Upload size={17} aria-hidden="true" />
              {shopText(language, preview ? 'replaceImage' : 'uploadImage')}
            </button>
            <p className="mt-3 text-center text-xs leading-relaxed text-ozora-cream/45">{shopText(language, 'imageHelp')}</p>
            {imageError ? <p className="mt-2 text-center text-sm font-semibold text-ozora-coral">{imageError}</p> : null}
          </div>
        </section>

        <div className="space-y-6">
          <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ozora-turquoise/10 text-ozora-turquoise">
                <PackageOpen size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-xl font-bold text-ozora-cream">{shopText(language, 'productDetails')}</h2>
                <p className="text-xs text-ozora-cream/45">{shopText(language, 'detailsHelp')}</p>
              </div>
            </div>

            <div className="mt-6 space-y-5">
              <label className="block">
                <span className="text-sm font-bold text-ozora-cream">{shopText(language, 'titleLabel')}</span>
                <input name="name" required maxLength={80} defaultValue={values.name} className={`${fieldClass} mt-2`} />
              </label>

              <div>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <label htmlFor="shop-description" className="text-sm font-bold text-ozora-cream">
                    {shopText(language, 'descriptionLabel')}
                  </label>
                  <span className="text-xs tabular-nums text-ozora-cream/40">{description.length}/1000</span>
                </div>
                <div className="mt-2 overflow-hidden rounded-2xl border border-white/15 bg-black/25 focus-within:border-ozora-turquoise focus-within:ring-2 focus-within:ring-ozora-turquoise/15">
                  <div className="flex items-center gap-1 border-b border-white/10 px-2 py-2">
                    <button
                      type="button"
                      onClick={() => formatDescription('**')}
                      aria-label={shopText(language, 'boldText')}
                      title={shopText(language, 'boldText')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-ozora-cream/70 transition hover:bg-white/10 hover:text-ozora-cream"
                    >
                      <Bold size={17} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => formatDescription('*')}
                      aria-label={shopText(language, 'italicText')}
                      title={shopText(language, 'italicText')}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-ozora-cream/70 transition hover:bg-white/10 hover:text-ozora-cream"
                    >
                      <Italic size={17} aria-hidden="true" />
                    </button>
                    <span className="ml-2 text-xs text-ozora-cream/35">{shopText(language, 'markdownHelp')}</span>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    id="shop-description"
                    name="description"
                    required
                    maxLength={1000}
                    rows={7}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="w-full resize-y bg-transparent px-4 py-3 text-base leading-relaxed text-ozora-cream outline-none placeholder:text-ozora-cream/30"
                  />
                </div>
                {description.trim() ? (
                  <div className="mt-3 rounded-2xl border border-white/10 bg-black/15 p-4">
                    <p className="mb-2 text-[0.65rem] font-bold uppercase tracking-[0.18em] text-ozora-cream/35">{shopText(language, 'preview')}</p>
                    <div className="text-sm leading-relaxed text-ozora-cream/70">
                      <ShopMarkdown text={description} />
                    </div>
                  </div>
                ) : null}
              </div>

              <label className="block">
                <span className="text-sm font-bold text-ozora-cream">{shopText(language, 'priceLabel')}</span>
                <div className="relative mt-2">
                  <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-bold text-ozora-yellow">€</span>
                  <input
                    name="amount"
                    required
                    inputMode="decimal"
                    defaultValue={values.amount}
                    placeholder="50.00"
                    className={`${fieldClass} pl-10 font-bold tabular-nums`}
                  />
                </div>
              </label>
            </div>
          </section>

          <fieldset className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 shadow-[0_24px_70px_rgba(0,0,0,0.18)] md:p-7">
            <div>
              <legend className="font-display text-xl font-bold text-ozora-cream">{shopText(language, 'stockLabel')}</legend>
              <p className="mt-1 text-xs text-ozora-cream/45">{shopText(language, 'stockHelp')}</p>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
              {shopSizeCodes.map((code) => (
                <label key={code} className="rounded-2xl border border-white/10 bg-black/20 p-3 text-center transition focus-within:border-ozora-turquoise">
                  <span className="text-xs font-bold uppercase tracking-[0.16em] text-ozora-cream/60">{sizeLabel(code, language)}</span>
                  <input
                    name={`stock-${code}`}
                    required
                    inputMode="numeric"
                    min={0}
                    max={999}
                    defaultValue={values.stock[code]}
                    aria-label={`${shopText(language, 'stockLabel')} ${sizeLabel(code, language)}`}
                    className="mt-2 w-full bg-transparent text-center text-2xl font-bold tabular-nums text-ozora-cream outline-none"
                  />
                  <span className="mt-1 block text-[0.65rem] text-ozora-cream/35">{shopText(language, 'pieces')}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <section className="rounded-[2rem] border border-white/10 bg-ozora-navy/55 p-5 md:p-7">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${hidden ? 'bg-ozora-coral/10 text-ozora-coral' : 'bg-emerald-400/10 text-emerald-300'}`}>
                  {hidden ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                </span>
                <div>
                  <h2 className="font-display text-xl font-bold text-ozora-cream">{shopText(language, 'visibility')}</h2>
                  <p className="mt-1 text-xs text-ozora-cream/45">{shopText(language, hidden ? 'hiddenHelp' : 'visibleHelp')}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={!hidden}
                onClick={() => setHidden((current) => !current)}
                className={`relative h-8 w-14 rounded-full transition ${hidden ? 'bg-white/15' : 'bg-emerald-400'}`}
              >
                <span className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition ${hidden ? 'left-1' : 'left-7'}`} />
                <span className="sr-only">{shopText(language, hidden ? 'showProduct' : 'hideProduct')}</span>
              </button>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-4 rounded-[2rem] border border-white/10 bg-black/15 p-4">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex h-12 min-w-40 items-center justify-center rounded-full bg-ozora-yellow px-6 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-ozora-cream/40"
            >
              {pending ? shopText(language, 'savingProduct') : shopText(language, 'saveProduct')}
            </button>
            {creating ? null : (
              <button
                type="button"
                onClick={() => {
                  setDeleteResult(null);
                  setDeleteOpen(true);
                }}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-ozora-coral/35 px-5 text-sm font-bold text-ozora-coral transition hover:bg-ozora-coral/10"
              >
                <Trash2 size={17} aria-hidden="true" />
                {shopText(language, 'deleteProduct')}
              </button>
            )}
            {result?.notice === 'saved' ? <p className="text-sm font-semibold text-emerald-300">{shopText(language, 'productSaved')}</p> : null}
            {result?.notice === 'invalid' || result?.notice === 'denied' ? (
              <p className="text-sm font-semibold text-ozora-coral">{shopText(language, 'productInvalid')}</p>
            ) : null}
          </div>
        </div>
      </form>

      <dialog
        ref={dialogRef}
        onCancel={(event) => {
          event.preventDefault();
          closeCrop();
        }}
        className="m-auto w-[min(92vw,42rem)] rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        <div className="p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold">{shopText(language, 'cropImage')}</h2>
              <p className="mt-1 text-sm text-ozora-cream/55">{shopText(language, 'cropHelp')}</p>
            </div>
            <button type="button" onClick={closeCrop} className="rounded-full px-3 py-2 text-sm font-bold text-ozora-cream/60 hover:bg-white/10">
              {shopText(language, 'cancel')}
            </button>
          </div>
          <div className="relative mt-5 aspect-[4/5] max-h-[58vh] overflow-hidden rounded-2xl bg-black/40">
            {cropSource ? (
              <Cropper
                image={cropSource}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5}
                showGrid
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_area, pixels) => setCropPixels(pixels)}
              />
            ) : null}
          </div>
          <label className="mt-5 block">
            <span className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-ozora-cream/55">
              {shopText(language, 'zoom')}
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
              {shopText(language, 'cancel')}
            </button>
            <button
              type="button"
              onClick={useCrop}
              disabled={cropping || !cropPixels}
              className="h-11 rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:opacity-40"
            >
              {cropping ? shopText(language, 'croppingImage') : shopText(language, 'useImage')}
            </button>
          </div>
        </div>
      </dialog>

      <dialog
        ref={reviewDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          setReview(undefined);
        }}
        className="m-auto w-[min(92vw,46rem)] rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        {review ? (
          <div className="p-5 md:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-ozora-yellow">{shopText(language, 'reviewChanges')}</p>
                <h2 className="mt-2 font-display text-3xl font-bold">{shopText(language, 'checkProduct')}</h2>
                <p className="mt-1 text-sm text-ozora-cream/55">{shopText(language, 'reviewHelp')}</p>
              </div>
              <button type="button" onClick={() => setReview(undefined)} className="rounded-full px-3 py-2 text-sm font-bold text-ozora-cream/60 hover:bg-white/10">
                {shopText(language, 'editChanges')}
              </button>
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-[9rem_1fr]">
              <div className="flex aspect-[4/5] overflow-hidden rounded-2xl border border-white/10 bg-black/25">
                {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : <ShopImagePlaceholder />}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="font-display text-2xl font-bold">{review.name}</h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${review.hidden ? 'bg-ozora-coral/10 text-ozora-coral' : 'bg-emerald-400/10 text-emerald-300'}`}>
                    {shopText(language, review.hidden ? 'hiddenProduct' : 'visibleProduct')}
                  </span>
                </div>
                <p className="mt-2 text-2xl font-bold text-ozora-yellow">€{review.amount}</p>
                <div className="mt-4 text-sm leading-relaxed text-ozora-cream/70">
                  <ShopMarkdown text={review.description} />
                </div>
                <div className="mt-5 flex flex-wrap gap-2">
                  {review.stock.map((item) => (
                    <span key={item.label} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs">
                      <strong>{item.label}</strong> · {item.count}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap justify-end gap-3">
              <button type="button" onClick={() => setReview(undefined)} className="h-11 rounded-full border border-white/15 px-5 text-sm font-bold hover:bg-white/10">
                {shopText(language, 'editChanges')}
              </button>
              <button
                type="button"
                onClick={commitSave}
                disabled={pending}
                className="h-11 rounded-full bg-ozora-yellow px-6 text-sm font-bold text-ozora-ink transition hover:bg-ozora-coral disabled:opacity-40"
              >
                {pending ? shopText(language, 'savingProduct') : shopText(language, 'saveChanges')}
              </button>
            </div>
          </div>
        ) : null}
      </dialog>

      <dialog
        ref={successDialogRef}
        onCancel={(event) => event.preventDefault()}
        className="m-auto w-[min(92vw,32rem)] rounded-[2rem] border border-white/15 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        {savedProduct ? (
          <div className="p-7 text-center">
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/10 text-emerald-300">
              <CheckCircle2 size={30} aria-hidden="true" />
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold">
              {shopText(language, savedProduct.created ? 'productCreated' : 'productUpdated')}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ozora-cream/60">
              {shopText(language, savedProduct.created ? 'createdNext' : 'updatedNext')}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {savedProduct.created ? (
                <a
                  href="/admin/shop/new"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-5 text-sm font-bold hover:bg-white/10"
                >
                  <Plus size={17} aria-hidden="true" />
                  {shopText(language, 'addAnotherProduct')}
                </a>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    successDialogRef.current?.close();
                    setSavedProduct(undefined);
                  }}
                  className="h-11 rounded-full border border-white/15 px-5 text-sm font-bold hover:bg-white/10"
                >
                  {shopText(language, 'continueEditing')}
                </button>
              )}
              <a href="/shop" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-ozora-yellow px-5 text-sm font-bold text-ozora-ink hover:bg-ozora-coral">
                <Store size={17} aria-hidden="true" />
                {shopText(language, 'goToShop')}
              </a>
            </div>
          </div>
        ) : null}
      </dialog>

      <dialog
        ref={deleteDialogRef}
        onCancel={(event) => {
          event.preventDefault();
          if (!deleting) {
            setDeleteOpen(false);
          }
        }}
        className="m-auto w-[min(92vw,31rem)] rounded-[2rem] border border-ozora-coral/30 bg-ozora-navy p-0 text-ozora-cream shadow-[0_30px_120px_rgba(0,0,0,0.7)] backdrop:bg-black/80"
      >
        <div className="p-7">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-ozora-coral/10 text-ozora-coral">
            <AlertTriangle size={26} aria-hidden="true" />
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold">{shopText(language, 'deleteProduct')}</h2>
          <p className="mt-2 text-sm leading-relaxed text-ozora-cream/60">
            {shopText(language, 'deleteWarning').replace('{name}', values.name)}
          </p>
          {deleteResult?.notice === 'invalid' || deleteResult?.notice === 'denied' ? (
            <p className="mt-4 text-sm font-semibold text-ozora-coral">{shopText(language, 'deleteFailed')}</p>
          ) : null}
          <div className="mt-7 flex justify-end gap-3">
            <button
              type="button"
              disabled={deleting}
              onClick={() => setDeleteOpen(false)}
              className="h-11 rounded-full border border-white/15 px-5 text-sm font-bold hover:bg-white/10 disabled:opacity-40"
            >
              {shopText(language, 'cancel')}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={deleteProduct}
              className="h-11 rounded-full bg-ozora-coral px-5 text-sm font-bold text-ozora-ink transition hover:bg-ozora-yellow disabled:opacity-40"
            >
              {deleting ? shopText(language, 'deletingProduct') : shopText(language, 'confirmDelete')}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
