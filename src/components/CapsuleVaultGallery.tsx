import React, { useState } from 'react';
import { Lock, Unlock, Download, Eye, Compass, Trash2, X, ArrowUpRight } from 'lucide-react';
import { CapturedTimeCapsule } from '../types/capsule';
import { soundEngine } from '../utils/soundEngine';

interface CapsuleVaultGalleryProps {
  capsules: CapturedTimeCapsule[];
  onToggleSealState: (capsuleId: string) => void;
  onDeleteCapsule: (capsuleId: string) => void;
  onLoadSiteIntoViewfinder: (siteId: string) => void;
}

export const CapsuleVaultGallery: React.FC<CapsuleVaultGalleryProps> = ({
  capsules,
  onToggleSealState,
  onDeleteCapsule,
  onLoadSiteIntoViewfinder,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked' | 'sealed'>('all');
  const [inspectedCapsule, setInspectedCapsule] = useState<CapturedTimeCapsule | null>(null);

  const filteredCapsules = capsules.filter((c) => {
    if (filterMode === 'unlocked') return !c.isSealed;
    if (filterMode === 'sealed') return c.isSealed;
    return true;
  });

  return (
    <section className="space-y-6">
      {/* Header & Interactive Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/90 pb-5">
        <div>
          <div className="text-xs font-mono-tabular text-amber-400">
            CONTACT SHEET & TEMPORAL REPOSITORY
          </div>
          <h2 className="text-2xl font-display font-bold text-[#F4F4F0] mt-1">
            Geo-Anchored Time-Capsule Vault
          </h2>
          <p className="text-sm text-zinc-400 mt-1 max-w-2xl">
            Every sealed plate preserves its historical optical stock, spatial heading, and time-lock release signature.
          </p>
        </div>

        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-lg self-start">
          {(['all', 'unlocked', 'sealed'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                soundEngine.playRangefinderTick();
                setFilterMode(mode);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                filterMode === mode
                  ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode === 'all'
                ? `All Plates (${capsules.length})`
                : mode === 'unlocked'
                ? `Open Archives (${capsules.filter((c) => !c.isSealed).length})`
                : `Time-Locked (${capsules.filter((c) => c.isSealed).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Contact Sheet Grid */}
      {filteredCapsules.length === 0 ? (
        <div className="p-12 text-center border border-zinc-800/80 rounded-xl bg-[#121215]">
          <p className="text-sm text-zinc-300">No time-capsule plates match the active filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCapsules.map((cap, idx) => (
            <article
              key={cap.id}
              className="group bg-[#121215] border border-zinc-800/90 hover:border-zinc-700 rounded-xl overflow-hidden flex flex-col justify-between transition-colors"
            >
              <div>
                {/* Contact Sheet Film Strip Header */}
                <div className="flex items-center justify-between px-4 py-2 bg-zinc-950 border-b border-zinc-800/80 text-[11px] font-mono-tabular text-zinc-400">
                  <span>FRAME #{String(idx + 1).padStart(2, '0')}A</span>
                  <span>
                    {cap.originYear} ⇄ {cap.unlockYear}
                  </span>
                </div>

                {/* Image Container */}
                <div
                  onClick={() => setInspectedCapsule(cap)}
                  className="relative aspect-video bg-zinc-950 overflow-hidden cursor-pointer"
                >
                  <img
                    src={cap.compositeDataUrl}
                    alt={cap.title}
                    referrerPolicy="no-referrer"
                    className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02] ${
                      cap.isSealed ? 'blur-[2px] brightness-75 contrast-125' : ''
                    }`}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Status Overlay */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono-tabular">
                    <span
                      className={`inline-flex items-center gap-1.5 font-medium ${
                        cap.isSealed ? 'text-amber-400' : 'text-emerald-400'
                      }`}
                    >
                      {cap.isSealed ? (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>SEALED UNTIL {cap.unlockYear}</span>
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" />
                          <span>OPEN ARCHIVE</span>
                        </>
                      )}
                    </span>
                    <span className="text-zinc-300">SPLIT {cap.splitRatio}%</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-2">
                  {/* Quiet unboxed metadata line */}
                  <div className="flex items-center gap-2 text-xs font-mono-tabular text-zinc-400">
                    <span>{cap.siteName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{cap.coordinates.lat.toFixed(3)}°N</span>
                  </div>

                  <h3 className="text-base font-semibold text-[#F4F4F0] leading-snug">
                    {cap.title}
                  </h3>

                  <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                    {cap.isSealed
                      ? `Cryptographically sealed for ${cap.recipientOrPublic}. Unlocks in ${cap.unlockYear} (override available for inspection).`
                      : cap.messageNote}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-4 py-3 border-t border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playAnchorLockChime();
                      onToggleSealState(cap.id);
                    }}
                    className="text-zinc-300 hover:text-amber-400 font-medium transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {cap.isSealed ? 'Override Time-Lock' : 'Re-Seal Capsule'}
                  </button>
                  <span aria-hidden="true" className="text-zinc-700">·</span>
                  <button
                    type="button"
                    onClick={() => onLoadSiteIntoViewfinder(cap.siteId)}
                    className="text-zinc-400 hover:text-[#F4F4F0] transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Load Portal
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInspectedCapsule(cap)}
                    className="text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                  >
                    <span>Inspect</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteCapsule(cap.id)}
                    aria-label="Delete capsule"
                    className="text-zinc-500 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Fullscreen Lightbox Inspection Modal */}
      {inspectedCapsule && (
        <div
          onClick={() => setInspectedCapsule(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl bg-[#121215] border border-zinc-700 rounded-xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div>
                <div className="text-xs font-mono-tabular text-amber-400">
                  EPOCH {inspectedCapsule.originYear} ⇄ {inspectedCapsule.unlockYear} · {inspectedCapsule.siteName}
                </div>
                <h3 className="text-lg font-display font-bold text-[#F4F4F0]">
                  {inspectedCapsule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectedCapsule(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-8 bg-black flex items-center justify-center">
                <img
                  src={inspectedCapsule.compositeDataUrl}
                  alt={inspectedCapsule.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[65vh] object-contain"
                />
              </div>
              <div className="lg:col-span-4 p-6 flex flex-col justify-between space-y-4 border-t lg:border-t-0 lg:border-l border-zinc-800">
                <div className="space-y-4">
                  <div>
                    <div className="text-[11px] font-mono-tabular text-zinc-400">RECIPIENT ARCHIVE</div>
                    <div className="text-sm font-medium text-[#F4F4F0] mt-0.5">
                      {inspectedCapsule.recipientOrPublic}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular text-zinc-400">FIELD INSCRIPTION</div>
                    <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                      {inspectedCapsule.messageNote}
                    </p>
                  </div>

                  <div>
                    <div className="text-[11px] font-mono-tabular text-zinc-400">SPATIAL TELEMETRY</div>
                    <div className="text-xs font-mono-tabular text-zinc-300 mt-1 space-y-1">
                      <div>LAT: {inspectedCapsule.coordinates.lat.toFixed(4)}° N</div>
                      <div>LNG: {inspectedCapsule.coordinates.lng.toFixed(4)}° E</div>
                      <div>AZIMUTH: {inspectedCapsule.coordinates.headingDeg.toFixed(1)}°</div>
                      <div>PORTAL SPLIT: {inspectedCapsule.splitRatio}%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex items-center justify-between gap-2">
                  <a
                    href={inspectedCapsule.compositeDataUrl}
                    download={`${inspectedCapsule.id}.jpg`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Plate</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => {
                      onLoadSiteIntoViewfinder(inspectedCapsule.siteId);
                      setInspectedCapsule(null);
                    }}
                    className="px-3 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-[#F4F4F0] cursor-pointer"
                  >
                    Open in Viewfinder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
