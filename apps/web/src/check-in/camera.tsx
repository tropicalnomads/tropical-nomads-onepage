'use client';

import { BrowserQRCodeReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { checkInText } from '../i18n/copy';
import { useLanguage } from '../i18n/provider';
import { scanAction, type CheckInActionResult } from './actions';

export function QrCamera({ partyId, onResult }: { partyId: string; onResult: (result: CheckInActionResult) => void }) {
  const { language } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [blocked, setBlocked] = useState(false);
  const resultRef = useRef(onResult);
  resultRef.current = onResult;

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return undefined;
    }
    const reader = new BrowserQRCodeReader();
    let stopped = false;
    let controls: { stop: () => void } | undefined;
    reader
      .decodeFromVideoDevice(undefined, video, (result, _error, controlsNext) => {
        controls = controlsNext;
        const text = result?.getText();
        if (!text || stopped) {
          return;
        }
        stopped = true;
        controlsNext.stop();
        void scanAction(partyId, text).then((outcome) => resultRef.current(outcome));
      })
      .catch(() => setBlocked(true));
    return () => {
      stopped = true;
      controls?.stop();
    };
  }, [partyId]);

  async function onImage(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const reader = new BrowserQRCodeReader();
      const result = await reader.decodeFromImageUrl(url);
      resultRef.current(await scanAction(partyId, result.getText()));
    } catch {
      resultRef.current({ admitted: false, reason: 'unknown' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-ozora-cream">{checkInText(language, 'scan')}</p>
      <video ref={videoRef} className="aspect-square w-full max-w-sm rounded-2xl bg-black object-cover" muted playsInline />
      {blocked ? <p className="text-sm text-ozora-yellow">{checkInText(language, 'cameraBlocked')}</p> : null}
      <label className="inline-flex cursor-pointer rounded-lg border border-white/15 px-3 py-2 text-sm text-ozora-cream">
        {checkInText(language, 'chooseImage')}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(event) => {
            void onImage(event.currentTarget.files?.[0]);
          }}
        />
      </label>
    </div>
  );
}
