import React from 'react';
import { Camera, Compass, Archive, Radio, SlidersHorizontal } from 'lucide-react';

export type ActiveWorkspaceTab = 'viewfinder' | 'anchors' | 'calibration' | 'vault';

interface TopBarProps {
  activeTab: ActiveWorkspaceTab;
  onSelectTab: (tab: ActiveWorkspaceTab) => void;
  liveCameraActive: boolean;
  onToggleLiveCamera: () => void;
  onTriggerCaptureModal: () => void;
  vaultCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  liveCameraActive,
  onToggleLiveCamera,
  onTriggerCaptureModal,
  vaultCount,
}) => {
  return (
    <header className="flex items-center justify-between px-6 h-14 border-b border-zinc-800/90 bg-[#09090B]/95 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#viewfinder"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('viewfinder');
        }}
        className="font-display text-lg font-bold tracking-tight text-[#F4F4F0] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded"
      >
        ChronoLens AR
      </a>

      {/* Zone 2: 4-5 clean text navigation links */}
      <nav aria-label="Primary Workspace" className="hidden md:flex items-center gap-7 text-sm font-medium">
        <button
          type="button"
          onClick={() => onSelectTab('viewfinder')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === 'viewfinder'
              ? 'text-[#F4F4F0] border-amber-500'
              : 'text-zinc-400 border-transparent hover:text-[#F4F4F0]'
          }`}
        >
          AR Viewfinder
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('anchors')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === 'anchors'
              ? 'text-[#F4F4F0] border-amber-500'
              : 'text-zinc-400 border-transparent hover:text-[#F4F4F0]'
          }`}
        >
          Spatial Portals
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('calibration')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === 'calibration'
              ? 'text-[#F4F4F0] border-amber-500'
              : 'text-zinc-400 border-transparent hover:text-[#F4F4F0]'
          }`}
        >
          Optical Lab
        </button>
        <button
          type="button"
          onClick={() => onSelectTab('vault')}
          className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
            activeTab === 'vault'
              ? 'text-[#F4F4F0] border-amber-500'
              : 'text-zinc-400 border-transparent hover:text-[#F4F4F0]'
          }`}
        >
          Capsule Vault ({vaultCount})
        </button>
      </nav>

      {/* Zone 3: 1-2 primary actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleLiveCamera}
          className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
            liveCameraActive
              ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/25'
              : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${liveCameraActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-400'}`} />
          <span>{liveCameraActive ? 'Live Sensor Active' : 'Enable Live Camera'}</span>
        </button>

        <button
          type="button"
          onClick={onTriggerCaptureModal}
          className="flex items-center gap-2 px-4 py-1.5 text-xs font-semibold text-zinc-950 bg-amber-500 rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap shrink-0 shadow-sm cursor-pointer"
        >
          <Camera className="w-3.5 h-3.5" />
          <span>Seal Time Capsule</span>
        </button>
      </div>
    </header>
  );
};
