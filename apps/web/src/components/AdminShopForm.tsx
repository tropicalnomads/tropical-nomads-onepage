'use client';

import { AlertTriangle, ArrowLeft, Bold, CheckCircle2, Eye, EyeOff, Italic, PackageOpen, Plus, Store, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { sizeLabel } from '../../../one-pager/src/lib/shop.ts';
import { deleteShopProductAction, saveShopProductAction, type ShopDeleteNotice, type ShopProductNotice } from '../admin/shop-actions';
import { shopSizeCodes, type ShopProductValues } from '../admin/shop-values';
import { shopText } from '../i18n/shop-copy';
import { useLanguage } from '../i18n/provider';
import { publicHref } from '../seo/urls';
import { shopCropSize } from '../shop/crop-image';
import { ShopMarkdown } from '../shop/markdown';
import { CroppedImageField } from './admin/CroppedImageField';
import { adminFieldClass as fieldClass } from './admin/form';
import { ShopImagePlaceholder } from './ShopImagePlaceholder';
import { Button, TextLink } from './ui/Button';

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
  const [hidden, setHidden] = useState(values.hidden);
  const [review, setReview] = useState<ProductReview>();
  const [savedProduct, setSavedProduct] = useState<{ id: string; created: boolean }>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteResult, setDeleteResult] = useState<ShopDeleteNotice | null>(null);
  const [deleting, setDeleting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewDialogRef = useRef<HTMLDialogElement>(null);
  const successDialogRef = useRef<HTMLDialogElement>(null);
  const deleteDialogRef = useRef<HTMLDialogElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const creating = values.id === '';

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
      window.location.assign('/admin/shops');
      return;
    }
    setDeleting(false);
  }

  return (
    <div className="mx-auto max-w-6xl px-1">
      <Button href={publicHref('/shop', language)} tone="ghost" size="sm" icon={<ArrowLeft size={16} aria-hidden="true" />}>
        {shopText(language, 'backShop')}
      </Button>
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

        <CroppedImageField
          preview={preview}
          aspect={4 / 5}
          aspectClass="aspect-[4/5]"
          output={shopCropSize}
          fileName="product.webp"
          labels={{
            title: shopText(language, 'productImage'),
            ratio: shopText(language, 'imageRatio'),
            remove: shopText(language, 'removeImage'),
            noImage: shopText(language, 'noImage'),
            placeholder: shopText(language, 'imagePlaceholder'),
            replace: shopText(language, 'replaceImage'),
            upload: shopText(language, 'uploadImage'),
            help: shopText(language, 'imageHelp'),
            invalid: shopText(language, 'imageInvalid'),
            cropTitle: shopText(language, 'cropImage'),
            cropHelp: shopText(language, 'cropHelp'),
            cancel: shopText(language, 'cancel'),
            zoom: shopText(language, 'zoom'),
            cropping: shopText(language, 'croppingImage'),
            use: shopText(language, 'useImage'),
          }}
          onChange={(next) => {
            setPreview(next.preview);
            setImageFile(next.file);
            setImageRemoved(next.removed);
          }}
        />

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
            <Button type="submit" disabled={pending} className="min-w-40">
              {pending ? shopText(language, 'savingProduct') : shopText(language, 'saveProduct')}
            </Button>
            {creating ? null : (
              <Button
                type="button"
                tone="secondary"
                onClick={() => {
                  setDeleteResult(null);
                  setDeleteOpen(true);
                }}
                icon={<Trash2 size={17} aria-hidden="true" />}
              >
                {shopText(language, 'deleteProduct')}
              </Button>
            )}
            {result?.notice === 'saved' ? <p className="text-sm font-semibold text-emerald-300">{shopText(language, 'productSaved')}</p> : null}
            {result?.notice === 'invalid' || result?.notice === 'denied' ? (
              <p className="text-sm font-semibold text-ozora-coral">{shopText(language, 'productInvalid')}</p>
            ) : null}
          </div>
        </div>
      </form>

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
              <TextLink onClick={() => setReview(undefined)}>{shopText(language, 'editChanges')}</TextLink>
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
              <Button type="button" tone="ghost" onClick={() => setReview(undefined)}>
                {shopText(language, 'editChanges')}
              </Button>
              <Button type="button" onClick={commitSave} disabled={pending}>
                {pending ? shopText(language, 'savingProduct') : shopText(language, 'saveChanges')}
              </Button>
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
                <Button href="/admin/shop/new" tone="ghost" icon={<Plus size={17} aria-hidden="true" />}>
                  {shopText(language, 'addAnotherProduct')}
                </Button>
              ) : (
                <Button
                  type="button"
                  tone="ghost"
                  onClick={() => {
                    successDialogRef.current?.close();
                    setSavedProduct(undefined);
                  }}
                >
                  {shopText(language, 'continueEditing')}
                </Button>
              )}
              <Button href={publicHref('/shop', language)} icon={<Store size={17} aria-hidden="true" />}>
                {shopText(language, 'goToShop')}
              </Button>
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
            <Button type="button" tone="ghost" disabled={deleting} onClick={() => setDeleteOpen(false)}>
              {shopText(language, 'cancel')}
            </Button>
            <Button type="button" tone="secondary" disabled={deleting} onClick={deleteProduct}>
              {deleting ? shopText(language, 'deletingProduct') : shopText(language, 'confirmDelete')}
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}
