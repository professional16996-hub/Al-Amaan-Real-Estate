import React, { useEffect, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  ImagePlus,
  Link2,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import { apiRequest, uploadMediaRequest, uploadMultipleMediaFiles } from '../services/api';
import type { MediaAsset } from '../types/models';
import { ResilientImage } from './ResilientImage';

interface LibraryModalProps {
  open: boolean;
  multi?: boolean;
  initialSelected?: string[];
  onClose: () => void;
  onSelectSingle?: (url: string) => void;
  onSelectMultiple?: (urls: string[]) => void;
}

const EMPTY_SELECTION: string[] = [];

const MediaLibraryModal: React.FC<LibraryModalProps> = ({
  open,
  multi = false,
  initialSelected = EMPTY_SELECTION,
  onClose,
  onSelectSingle,
  onSelectMultiple,
}) => {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUrls, setSelectedUrls] = useState<string[]>(initialSelected);

  useEffect(() => {
    if (!open) return;
    setSelectedUrls(initialSelected);
    setLoading(true);
    apiRequest<{ media: MediaAsset[] }>('/api/admin/media', { scope: 'admin' })
      .then((res) => setAssets(res.media))
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  const toggleMultiUrl = (url: string) => {
    setSelectedUrls((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-3xl max-h-[85vh] rounded-t-lg sm:rounded-md flex flex-col overflow-hidden shadow-2xl">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-display text-xl font-semibold text-[#0B192C]">
              Choose from Media Library
            </h3>
            <p className="text-xs text-slate-500">
              {multi ? 'Tap photos to add them to your gallery.' : 'Tap any photo to select it.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close media library"
            className="p-2 text-slate-500 hover:text-slate-900"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading saved photos...</div>
          ) : assets.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500">
              No saved photos yet. Pick one from your phone gallery first.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {assets.map((asset) => {
                const isSelected = selectedUrls.includes(asset.url);
                return (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => {
                      if (multi) {
                        toggleMultiUrl(asset.url);
                      } else {
                        onSelectSingle?.(asset.url);
                        onClose();
                      }
                    }}
                    className={`group text-left rounded border overflow-hidden transition-all ${
                      isSelected
                        ? 'border-[#B89146] ring-2 ring-[#B89146]/40'
                        : 'border-slate-200 hover:border-[#0B192C]'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-slate-900">
                      <ResilientImage src={asset.url} alt={asset.title} className="w-full h-full object-cover" />
                      {isSelected && (
                        <span className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#B89146] text-[#0B192C] flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <p className="px-2.5 py-2 text-[11px] font-medium text-slate-700 truncate bg-white">
                      {asset.title}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {multi && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-600 font-mono-num">
              {selectedUrls.length} selected
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium border border-slate-300 rounded bg-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMultiple?.(selectedUrls);
                  onClose();
                }}
                className="px-5 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded"
              >
                Apply Selected Photos
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface StagedFile {
  file: File;
  previewUrl: string;
}

interface SingleImageFieldProps {
  label: string;
  value: string;
  onChange: (nextUrl: string) => void;
  titleHint?: string;
  helperText?: string;
  allowClear?: boolean;
}

export const SingleImageField: React.FC<SingleImageFieldProps> = ({
  label,
  value,
  onChange,
  titleHint = 'Website Photo',
  helperText,
  allowClear = false,
}) => {
  const [staged, setStaged] = useState<StagedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);

  useEffect(() => {
    return () => {
      if (staged) URL.revokeObjectURL(staged.previewUrl);
    };
  }, [staged]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    if (staged) URL.revokeObjectURL(staged.previewUrl);
    setStaged({
      file,
      previewUrl: URL.createObjectURL(file),
    });
  };

  const confirmUploadStaged = async () => {
    if (!staged) return;
    setUploading(true);
    setError(null);
    try {
      const res = await uploadMediaRequest<{ asset: MediaAsset }>(
        '/api/admin/media/upload',
        staged.file,
        titleHint
      );
      onChange(res.asset.url);
      URL.revokeObjectURL(staged.previewUrl);
      setStaged(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload photo.');
    } finally {
      setUploading(false);
    }
  };

  const cancelStaged = () => {
    if (staged) {
      URL.revokeObjectURL(staged.previewUrl);
      setStaged(null);
    }
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-800">{label}</label>
        {allowClear && value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:underline min-h-[32px] px-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>

      {helperText && <p className="text-[11px] text-slate-500">{helperText}</p>}

      {staged ? (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-md space-y-3">
          <p className="text-xs font-semibold text-amber-950">
            Ready to Upload Preview ({staged.file.name})
          </p>
          <div className="relative h-40 w-full max-w-xs rounded overflow-hidden border border-amber-300 bg-white">
            <img
              src={staged.previewUrl}
              alt="Selected preview before upload"
              className="w-full h-full object-contain bg-slate-900/5"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={uploading}
              onClick={confirmUploadStaged}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[42px]"
            >
              <UploadCloud className="w-4 h-4 text-[#D4AF37]" />
              <span>{uploading ? 'Uploading Photo...' : 'Confirm & Upload Photo'}</span>
            </button>
            <button
              type="button"
              disabled={uploading}
              onClick={cancelStaged}
              className="px-3.5 py-2.5 text-xs font-medium border border-slate-300 bg-white text-slate-700 rounded min-h-[42px]"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : value ? (
        <div className="relative h-36 sm:h-40 w-full max-w-xs rounded overflow-hidden border border-slate-300 bg-slate-900">
          <ResilientImage src={value} alt={label} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="h-28 w-full max-w-xs rounded border border-dashed border-slate-300 bg-white flex items-center justify-center text-xs text-slate-400">
          No photo selected yet
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] active:scale-[0.99] transition-all min-h-[42px]">
          <ImagePlus className="w-4 h-4 text-[#D4AF37]" />
          <span>{staged ? 'Pick Another Photo' : 'Pick from Phone Gallery'}</span>
          <input
            type="file"
            accept="image/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border border-slate-300 bg-white text-slate-800 rounded hover:border-[#0B192C] min-h-[42px]"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Saved Library</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#0B192C] px-2 py-2"
        >
          <Link2 className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide Link' : 'Or paste link'}</span>
        </button>
      </div>

      {showUrlInput && (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste image link (optional)"
          className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white"
        />
      )}

      <MediaLibraryModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelectSingle={(url) => onChange(url)}
      />
    </div>
  );
};

interface MultiImageGalleryFieldProps {
  label: string;
  images: string[];
  onChange: (nextImages: string[]) => void;
  titlePrefix?: string;
  showCoverBadge?: boolean;
}

export const MultiImageGalleryField: React.FC<MultiImageGalleryFieldProps> = ({
  label,
  images,
  onChange,
  titlePrefix = 'Gallery Photo',
  showCoverBadge = false,
}) => {
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  useEffect(() => {
    return () => {
      stagedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    };
  }, [stagedFiles]);

  const handleMultiPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const picked = Array.from(files).map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    e.target.value = '';
    setError(null);
    setStagedFiles((prev) => [...prev, ...picked]);
  };

  const removeStagedAt = (idx: number) => {
    setStagedFiles((prev) => {
      const target = prev[idx];
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const clearAllStaged = () => {
    stagedFiles.forEach((s) => URL.revokeObjectURL(s.previewUrl));
    setStagedFiles([]);
  };

  const confirmUploadStaged = async () => {
    if (stagedFiles.length === 0) return;
    setError(null);
    setUploadingStatus(`Uploading 1 of ${stagedFiles.length}...`);
    try {
      const results = await uploadMultipleMediaFiles<{ asset: MediaAsset }>(
        stagedFiles.map((s) => s.file),
        titlePrefix,
        (current, total) => setUploadingStatus(`Uploading photo ${current} of ${total}...`)
      );
      const newUrls = results.map((r) => r.asset.url);
      onChange(Array.from(new Set([...images, ...newUrls])));
      clearAllStaged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to upload one or more photos.');
    } finally {
      setUploadingStatus(null);
    }
  };

  const moveImage = (idx: number, direction: -1 | 1) => {
    const targetIdx = idx + direction;
    if (targetIdx < 0 || targetIdx >= images.length) return;
    const next = [...images];
    const [moved] = next.splice(idx, 1);
    next.splice(targetIdx, 0, moved);
    onChange(next);
  };

  const makeCover = (idx: number) => {
    if (idx <= 0 || idx >= images.length) return;
    const chosen = images[idx];
    const rest = images.filter((_, i) => i !== idx);
    onChange([chosen, ...rest]);
  };

  return (
    <div className="p-4 bg-slate-50 border border-slate-200 rounded-md space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-slate-800">
          {label} ({images.length})
        </label>
        <span className="text-[11px] text-slate-500">
          Pick multiple photos, preview before upload, and rearrange order anytime
        </span>
      </div>

      {error && (
        <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded px-2.5 py-1.5">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2.5">
        <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] active:scale-[0.99] transition-all min-h-[42px]">
          <ImagePlus className="w-4 h-4 text-[#D4AF37]" />
          <span>Pick Photos from Phone Gallery</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={Boolean(uploadingStatus)}
            onChange={handleMultiPick}
            className="hidden"
          />
        </label>

        <button
          type="button"
          onClick={() => setLibraryOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 text-xs font-semibold border border-slate-300 bg-white text-slate-800 rounded hover:border-[#0B192C] min-h-[42px]"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Saved Library</span>
        </button>

        <button
          type="button"
          onClick={() => setShowUrlInput((prev) => !prev)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#0B192C] px-2 py-2"
        >
          <Link2 className="w-3 h-3" />
          <span>{showUrlInput ? 'Hide Link' : 'Or paste link'}</span>
        </button>
      </div>

      {/* Staged Mobile Gallery Previews BEFORE Uploading */}
      {stagedFiles.length > 0 && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-md space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-amber-950">
              Preview Selected Photos Before Uploading ({stagedFiles.length})
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={Boolean(uploadingStatus)}
                onClick={confirmUploadStaged}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#0B192C] text-white rounded hover:bg-[#132742] disabled:opacity-60 min-h-[38px]"
              >
                <UploadCloud className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{uploadingStatus || `Upload ${stagedFiles.length} Photo(s)`}</span>
              </button>
              <button
                type="button"
                disabled={Boolean(uploadingStatus)}
                onClick={clearAllStaged}
                className="px-3 py-2 text-xs font-medium border border-slate-300 bg-white rounded min-h-[38px]"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2.5">
            {stagedFiles.map((item, idx) => (
              <div
                key={`${item.file.name}-${idx}`}
                className="relative aspect-[4/3] rounded overflow-hidden border border-amber-300 bg-white"
              >
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  disabled={Boolean(uploadingStatus)}
                  onClick={() => removeStagedAt(idx)}
                  aria-label="Remove staged preview"
                  className="absolute top-1 right-1 bg-black/80 text-white rounded-full p-1 hover:bg-rose-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUrlInput && (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image link"
            className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded bg-white"
          />
          <button
            type="button"
            onClick={() => {
              if (urlInput.trim()) {
                onChange([...images, urlInput.trim()]);
                setUrlInput('');
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 bg-white rounded"
          >
            Add
          </button>
        </div>
      )}

      {images.length === 0 ? (
        <div className="py-6 text-center rounded border border-dashed border-slate-300 bg-white text-xs text-slate-400">
          No photos added yet. Tap “Pick Photos from Phone Gallery” above.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, i) => (
            <div
              key={`${img}-${i}`}
              className="relative rounded overflow-hidden border border-slate-300 bg-white flex flex-col"
            >
              <div className="relative aspect-[4/3] bg-slate-900">
                <ResilientImage src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 text-[10px] font-mono-num font-semibold bg-black/75 text-white rounded">
                  #{i + 1}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(images.filter((_, idx) => idx !== i))}
                  aria-label="Remove photo"
                  className="absolute top-1.5 right-1.5 bg-black/80 text-white rounded-full p-1.5 hover:bg-rose-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Touch-Friendly Reorder & Cover Controls */}
              <div className="p-1.5 flex items-center justify-between gap-1 bg-white border-t border-slate-100">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={i === 0}
                    onClick={() => moveImage(i, -1)}
                    aria-label="Move photo earlier"
                    className="p-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={i === images.length - 1}
                    onClick={() => moveImage(i, 1)}
                    aria-label="Move photo later"
                    className="p-1.5 rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:opacity-35"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {showCoverBadge ? (
                  i === 0 ? (
                    <span className="text-[11px] font-semibold text-[#9F7A31] px-1">Cover</span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => makeCover(i)}
                      className="text-[11px] font-semibold text-[#0B192C] hover:text-[#9F7A31] underline px-1"
                    >
                      Set Cover
                    </button>
                  )
                ) : (
                  <span className="text-[10px] text-slate-400 px-1">Order {i + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <MediaLibraryModal
        open={libraryOpen}
        multi
        initialSelected={images}
        onClose={() => setLibraryOpen(false)}
        onSelectMultiple={(urls) => onChange(urls)}
      />
    </div>
  );
};
