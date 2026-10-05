import React, { useState } from 'react';
import { Lock, Unlock, Calendar, MapPin, Download, Check, X, Sparkles } from 'lucide-react';
import { CapturedTimeCapsule, HistoricalAnchorSite, OpticalStockPreset } from '../types/capsule';
import { soundEngine } from '../utils/soundEngine';

interface SealCapsuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  compositeDataUrl: string;
  site: HistoricalAnchorSite;
  stock: OpticalStockPreset;
  splitPercent: number;
  pastAlpha: number;
  suggestedNote?: string;
  onConfirmSeal: (newCapsule: CapturedTimeCapsule) => void;
}

export const SealCapsuleModal: React.FC<SealCapsuleModalProps> = ({
  isOpen,
  onClose,
  compositeDataUrl,
  site,
  stock,
  splitPercent,
  pastAlpha,
  suggestedNote,
  onConfirmSeal,
}) => {
  const [title, setTitle] = useState(`${site.title.split('—')[0].trim()} Alignment`);
  const [recipient, setRecipient] = useState('Public Spatial Heritage Vault');
  const [messageNote, setMessageNote] = useState(
    suggestedNote ||
      `Composite optical record aligning the ${site.pastYear} archival plate with the 2026 spatial baseline at ${site.locationName}.`
  );
  const [unlockYear, setUnlockYear] = useState<number>(2035);
  const [sealMode, setSealMode] = useState<'timelocked' | 'immediate'>('timelocked');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.playAnchorLockChime();

    const newCapsule: CapturedTimeCapsule = {
      id: `cap-${Date.now()}`,
      title: title.trim() || `${site.locationName} Capsule`,
      recipientOrPublic: recipient.trim() || 'Public Spatial Archive',
      messageNote: messageNote.trim(),
      capturedAtIso: new Date().toISOString(),
      originYear: site.pastYear,
      unlockDateIso: sealMode === 'timelocked' ? `${unlockYear}-01-01` : '2026-10-05',
      unlockYear: sealMode === 'timelocked' ? unlockYear : 2026,
      isSealed: sealMode === 'timelocked' && unlockYear > 2026,
      siteId: site.id,
      siteName: site.locationName,
      coordinates: {
        lat: site.coordinates.lat,
        lng: site.coordinates.lng,
        headingDeg: site.coordinates.headingDeg,
      },
      stockUsed: stock.id,
      splitRatio: splitPercent,
      compositeDataUrl,
      pastOverlayAlpha: pastAlpha,
      fieldNoteSummary: `Calibrated with ${stock.name} at ${splitPercent}% temporal split.`,
      pinCount: site.pins.length,
    };

    onConfirmSeal(newCapsule);
    onClose();
  };

  const handleDownloadFrame = () => {
    const link = document.createElement('a');
    link.href = compositeDataUrl;
    link.download = `chronolens-${site.pastYear}-2026-${Date.now()}.jpg`;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-[#121215] border border-zinc-700/90 rounded-xl shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <div className="text-xs font-mono-tabular text-amber-400">
              TEMPORAL ARCHIVE CRYPTOGRAPHIC SEAL
            </div>
            <h3 className="text-lg font-display font-bold text-[#F4F4F0]">
              Seal Geo-Anchored Time Capsule
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Preview of Captured Composite Plate */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 aspect-video rounded-lg overflow-hidden border border-zinc-700 bg-zinc-950 relative">
              <img
                src={compositeDataUrl}
                alt="Captured composite time-capsule frame"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="md:col-span-6 space-y-2 text-xs">
              <div className="font-mono-tabular text-zinc-400">
                PORTAL COORDINATES · {site.coordinates.lat.toFixed(4)}° N, {site.coordinates.lng.toFixed(4)}° E
              </div>
              <div className="text-sm font-semibold text-[#F4F4F0]">{site.title}</div>
              <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-zinc-400">
                <span>EPOCH {site.pastYear} ⇄ 2026</span>
                <span aria-hidden="true">·</span>
                <span>SPLIT {splitPercent}%</span>
                <span aria-hidden="true">·</span>
                <span>{stock.name}</span>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadFrame}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-[#F4F4F0] transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>Download Contact Print (.JPG)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Capsule Title & Recipient */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Capsule Archive Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Intended Recipient or Civic Archive
              </label>
              <input
                type="text"
                required
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Time-Lock Horizon Controls */}
          <div className="p-3.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Temporal Release Protocol</span>
              <div className="flex items-center gap-1 p-0.5 bg-zinc-950 border border-zinc-800 rounded-md">
                <button
                  type="button"
                  onClick={() => setSealMode('timelocked')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    sealMode === 'timelocked'
                      ? 'bg-amber-500 text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Future Time-Lock
                </button>
                <button
                  type="button"
                  onClick={() => setSealMode('immediate')}
                  className={`px-2.5 py-1 text-xs rounded transition-colors cursor-pointer ${
                    sealMode === 'immediate'
                      ? 'bg-emerald-500 text-zinc-950 font-semibold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Public Immediately
                </button>
              </div>
            </div>

            {sealMode === 'timelocked' && (
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">Scheduled Unlock Year</span>
                  <span className="font-mono-tabular text-amber-400 font-semibold">
                    YEAR {unlockYear} (+{unlockYear - 2026} Years)
                  </span>
                </div>
                <input
                  type="range"
                  min={2027}
                  max={2100}
                  value={unlockYear}
                  onChange={(e) => setUnlockYear(Number(e.target.value))}
                  className="w-full optical-slider"
                />
              </div>
            )}
          </div>

          {/* Field Inscription / Message */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Time-Capsule Field Inscription
            </label>
            <textarea
              rows={3}
              required
              value={messageNote}
              onChange={(e) => setMessageNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Commit to Spatial Vault</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
