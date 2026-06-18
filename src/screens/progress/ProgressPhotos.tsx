import { useRef, useState } from 'react';
import { Card } from '@/components/Card';
import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { useData, usePhotos, useSetPhotos } from '@/features/store';
import {
  addPhoto,
  removePhoto,
  comparePair,
  isFull,
  newPhotoId,
  MAX_PHOTOS,
} from '@/features/progress/photos';
import { compressImageFile } from '@/lib/image';
import { translator } from '@/lib/i18n';
import { todayKey } from '@/lib/calc';
import type { ProgressPhoto } from '@/types/schemas';

interface ProgressPhotosProps {
  /** Current body weight (kg) to snapshot against the photo. */
  curWeightKg: number;
}

const thumb = (src: string, alt: string): JSX.Element => (
  <img
    src={src}
    alt={alt}
    loading="lazy"
    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
  />
);

export function ProgressPhotos({ curWeightKg }: ProgressPhotosProps): JSX.Element {
  const data = useData();
  const photos = usePhotos();
  const setPhotos = useSetPhotos();
  const t = translator(data.settings.lang);
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ProgressPhoto | null>(null);

  const pair = comparePair(photos);

  const onPick = async (file: File | undefined): Promise<void> => {
    if (!file) return;
    setError(null);
    setBusy(true);
    try {
      const src = await compressImageFile(file);
      const photo: ProgressPhoto = {
        id: newPhotoId(),
        d: todayKey(),
        src,
        ...(curWeightKg > 0 ? { w: curWeightKg } : {}),
      };
      // Persistence-gated: if storage is full the photo is not kept in memory.
      const saved = setPhotos(addPhoto(photos, photo));
      if (!saved) setError(t('photoFull'));
    } catch {
      setError(t('photoErr'));
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = (id: string): void => {
    setPhotos(removePhoto(photos, id));
    setView((v) => (v?.id === id ? null : v));
  };

  return (
    <>
      <span className="pulse-header" style={{ display: 'block', marginTop: 22 }}>
        {t('progressPhotos')}
      </span>
      <p className="state__msg" style={{ textAlign: 'left', margin: '6px 0 12px' }}>
        {t('photosSub')}
      </p>

      <Card>
        {pair ? (
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            {(['first', 'latest'] as const).map((k) => {
              const ph = pair[k];
              return (
                <div key={k} style={{ flex: 1, minWidth: 0 }}>
                  <div className="stat-label" style={{ marginBottom: 6 }}>
                    {k === 'first' ? t('photoFirst') : t('photoLatest')} · {ph.d}
                  </div>
                  <div
                    style={{
                      aspectRatio: '3 / 4',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: 'var(--panel-2)',
                    }}
                  >
                    {thumb(ph.src, `${t('progressPhotos')} ${ph.d}`)}
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}

        {photos.length === 0 ? (
          <div className="state__msg" style={{ textAlign: 'left', marginBottom: 14 }}>
            {t('photosEmpty')}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))',
              gap: 8,
              marginBottom: 14,
            }}
          >
            {photos.map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setView(ph)}
                aria-label={`${t('viewPhoto')} ${ph.d}`}
                style={{
                  aspectRatio: '1 / 1',
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid var(--glass-border)',
                  padding: 0,
                  cursor: 'pointer',
                  background: 'var(--panel-2)',
                }}
              >
                {thumb(ph.src, `${t('progressPhotos')} ${ph.d}`)}
              </button>
            ))}
          </div>
        )}

        {error ? (
          <div className="warn-box" style={{ marginBottom: 12 }}>
            {error}
          </div>
        ) : null}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          aria-label={t('addPhoto')}
          style={{ display: 'none' }}
          onChange={(e) => void onPick(e.target.files?.[0])}
        />
        <Button
          onClick={() => fileRef.current?.click()}
          disabled={busy || isFull(photos)}
          style={{ width: '100%' }}
        >
          {busy ? t('photoSaving') : isFull(photos) ? t('photoCap') : t('addPhoto')}
        </Button>
        <div
          className="state__msg"
          style={{ textAlign: 'left', fontSize: '0.72rem', margin: '8px 0 0' }}
        >
          {photos.length}/{MAX_PHOTOS} · {t('photosPrivate')}
        </div>
      </Card>

      {view ? (
        <Modal onClose={() => setView(null)} label={`${t('progressPhotos')} ${view.d}`}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <div style={{ fontWeight: 800 }}>{view.d}</div>
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setView(null)}
            >
              ✕
            </button>
          </div>
          <div style={{ borderRadius: 14, overflow: 'hidden', background: 'var(--panel-2)' }}>
            {thumb(view.src, `${t('progressPhotos')} ${view.d}`)}
          </div>
          <Button
            variant="ghost"
            onClick={() => remove(view.id)}
            aria-label={`${t('deleteR')} ${view.d}`}
            style={{ width: '100%', marginTop: 14 }}
          >
            {t('deleteR')}
          </Button>
        </Modal>
      ) : null}
    </>
  );
}
