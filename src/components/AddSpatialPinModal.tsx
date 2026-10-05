import React, { useState } from 'react';
import { MapPin, X, Check } from 'lucide-react';
import { SpatialPin } from '../types/capsule';

interface AddSpatialPinModalProps {
  isOpen: boolean;
  coords: { xPercent: number; yPercent: number } | null;
  defaultYear: number;
  onClose: () => void;
  onSavePin: (newPin: SpatialPin) => void;
}

export const AddSpatialPinModal: React.FC<AddSpatialPinModalProps> = ({
  isOpen,
  coords,
  defaultYear,
  onClose,
  onSavePin,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<SpatialPin['category']>('Personal Memory');
  const [year, setYear] = useState<number>(2026);
  const [note, setNote] = useState('');
  const [author, setAuthor] = useState('Field Operator #09');
  const [isTimeLocked, setIsTimeLocked] = useState(false);

  if (!isOpen || !coords) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPin: SpatialPin = {
      id: `pin-custom-${Date.now()}`,
      xPercent: coords.xPercent,
      yPercent: coords.yPercent,
      title: title.trim() || 'Spatial Field Marker',
      timestampLabel: isTimeLocked ? `Sealed for ${year}` : `Anchored ${year}`,
      year,
      depthMeters: Math.round((12 + (100 - coords.yPercent) * 0.65) * 10) / 10,
      azimuthDeg: Math.round((95 + coords.xPercent * 0.45) * 10) / 10,
      elevationDeg: Math.round((25 - coords.yPercent * 0.4) * 10) / 10,
      note: note.trim() || 'Spatial fiducial observation recorded in AR viewfinder.',
      author: author.trim() || 'Field Operator',
      lockedUntilYear: isTimeLocked ? year : undefined,
      isUnlocked: !isTimeLocked,
      category,
    };
    onSavePin(newPin);
    setTitle('');
    setNote('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#121215] border border-zinc-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-[#F4F4F0]">
              Anchor Spatial Memory Pin (X:{coords.xPercent}% Y:{coords.yPercent}%)
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Pin Title / Architectural Fiducial
            </label>
            <input
              type="text"
              required
              placeholder="e.g., East Limestone Archway Plinth"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as SpatialPin['category'])}
                className="w-full px-2.5 py-2 text-xs bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
              >
                <option value="Personal Memory">Personal Memory</option>
                <option value="Architecture">Architecture</option>
                <option value="Historical Event">Historical Event</option>
                <option value="Future Message">Future Message</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Reference Year ({defaultYear}–2090)
              </label>
              <input
                type="number"
                min={1800}
                max={2150}
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-sm font-mono-tabular bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Spatial Observation or Capsule Note
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe what stood here or leave a note anchored to this 3D raycast..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-zinc-900 border border-zinc-700 rounded-lg text-[#F4F4F0] focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isTimeLocked}
                onChange={(e) => setIsTimeLocked(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-amber-500"
              />
              <span>Seal with Future Time-Lock</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Anchor Pin to Viewport</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
