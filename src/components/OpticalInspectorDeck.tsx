import React, { useState } from 'react';
import {
  Compass,
  Sliders,
  Sparkles,
  Volume2,
  Square,
  RotateCcw,
  Upload,
  Check,
  Film,
  Layers,
  MapPin,
} from 'lucide-react';
import { HistoricalAnchorSite, OpticalStockId, OpticalStockPreset } from '../types/capsule';
import { OPTICAL_STOCK_PRESETS } from '../data/historicalAnchors';
import { soundEngine } from '../utils/soundEngine';

interface OpticalInspectorDeckProps {
  sites: HistoricalAnchorSite[];
  selectedSite: HistoricalAnchorSite;
  onSelectSite: (site: HistoricalAnchorSite) => void;
  selectedStock: OpticalStockPreset;
  onSelectStock: (stock: OpticalStockPreset) => void;
  pastAlpha: number;
  onChangePastAlpha: (val: number) => void;
  customGrain: number;
  onChangeCustomGrain: (val: number) => void;
  customVignette: number;
  onChangeCustomVignette: (val: number) => void;
  customExposure: number;
  onChangeCustomExposure: (val: number) => void;
  onResetCalibration: () => void;
  onUploadCustomPastImage: (dataUrl: string, fileName: string) => void;
  onRequestFieldAnalysis: () => void;
  isAnalyzingField: boolean;
  fieldAnalysisReport: {
    architecturalContinuity: string;
    opticalNotes: string;
    suggestedCapsuleNote: string;
    narrationScript: string;
  } | null;
  onPlayVoiceNarration: (text: string) => void;
  isPlayingNarration: boolean;
}

export const OpticalInspectorDeck: React.FC<OpticalInspectorDeckProps> = ({
  sites,
  selectedSite,
  onSelectSite,
  selectedStock,
  onSelectStock,
  pastAlpha,
  onChangePastAlpha,
  customGrain,
  onChangeCustomGrain,
  customVignette,
  onChangeCustomVignette,
  customExposure,
  onChangeCustomExposure,
  onResetCalibration,
  onUploadCustomPastImage,
  onRequestFieldAnalysis,
  isAnalyzingField,
  fieldAnalysisReport,
  onPlayVoiceNarration,
  isPlayingNarration,
}) => {
  const [inspectorSection, setInspectorSection] = useState<'anchors' | 'stocks' | 'archaeologist'>('anchors');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        soundEngine.playAnchorLockChime();
        onUploadCustomPastImage(reader.result, file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="flex flex-col gap-4 bg-[#121215] border border-zinc-800/90 rounded-xl p-4 h-fit">
      {/* Segmented Control for Inspector Modes */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-zinc-900/90 border border-zinc-800 rounded-lg">
        <button
          type="button"
          onClick={() => setInspectorSection('anchors')}
          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
            inspectorSection === 'anchors'
              ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          1. Geo Portals
        </button>
        <button
          type="button"
          onClick={() => setInspectorSection('stocks')}
          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
            inspectorSection === 'stocks'
              ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          2. Film Stocks
        </button>
        <button
          type="button"
          onClick={() => setInspectorSection('archaeologist')}
          className={`py-1.5 px-2 text-xs font-medium rounded-md transition-colors whitespace-nowrap truncate cursor-pointer ${
            inspectorSection === 'archaeologist'
              ? 'bg-zinc-800 text-[#F4F4F0] shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          3. Field Scan
        </button>
      </div>

      {/* SECTION 1: SPATIAL HISTORICAL ANCHOR SITES */}
      {inspectorSection === 'anchors' && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F4F4F0]">Calibrated Spatial Portals</h2>
            <label className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer">
              <Upload className="w-3.5 h-3.5" />
              <span>Load Custom Plate</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="flex flex-col gap-2">
            {sites.map((site) => {
              const active = site.id === selectedSite.id;
              return (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playAnchorLockChime();
                    onSelectSite(site);
                  }}
                  className={`text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-900 border-amber-500/70'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono-tabular text-zinc-400">
                    <span className={active ? 'text-amber-400 font-semibold' : 'text-zinc-400'}>
                      EPOCH {site.pastYear}
                    </span>
                    <span>·</span>
                    <span>{site.locationName}</span>
                  </div>
                  <div className="text-sm font-semibold text-[#F4F4F0] mt-1">{site.title}</div>
                  <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-zinc-400 mt-1.5">
                    <span>{site.coordinates.lat.toFixed(3)}°N</span>
                    <span aria-hidden="true">·</span>
                    <span>HDG {site.coordinates.headingDeg.toFixed(1)}°</span>
                    <span aria-hidden="true">·</span>
                    <span>{site.pins.length} Spatial Pins</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Archival Plate Field Briefing */}
          <div className="pt-3 border-t border-zinc-800/90">
            <div className="text-xs font-mono-tabular text-zinc-400">
              OPTICAL REGISTRATION NOTES · {selectedSite.pastYear}
            </div>
            <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">{selectedSite.archivalSummary}</p>
            <p className="text-[11px] font-mono-tabular text-amber-400/90 mt-2">
              {selectedSite.opticalNotes}
            </p>
          </div>
        </div>
      )}

      {/* SECTION 2: HISTORICAL EMULSION & OPTICAL STOCKS */}
      {inspectorSection === 'stocks' && (
        <div className="flex flex-col gap-3.5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#F4F4F0]">Archival Emulsion Profiles</h2>
            <button
              type="button"
              onClick={() => {
                soundEngine.playRangefinderTick();
                onResetCalibration();
              }}
              className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-[#F4F4F0] cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Optics</span>
            </button>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {OPTICAL_STOCK_PRESETS.map((preset) => {
              const active = preset.id === selectedStock.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    soundEngine.playRangefinderTick();
                    onSelectStock(preset);
                  }}
                  className={`text-left p-2.5 rounded-lg border transition-colors cursor-pointer ${
                    active
                      ? 'bg-zinc-900 border-amber-500/80'
                      : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#F4F4F0]">{preset.name}</span>
                    <span className="text-[11px] font-mono-tabular text-amber-400">{preset.eraLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-zinc-400 mt-1">
                    <span>{preset.isoEquivalent}</span>
                    <span aria-hidden="true">·</span>
                    <span>{preset.focalCharacter}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Fine Optical Calibration Sliders */}
          <div className="pt-3 border-t border-zinc-800/90 flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Archival Overlay Density</span>
                <span className="font-mono-tabular text-zinc-200">{Math.round(pastAlpha * 100)}%</span>
              </div>
              <input
                type="range"
                min={15}
                max={100}
                value={Math.round(pastAlpha * 100)}
                onChange={(e) => onChangePastAlpha(Number(e.target.value) / 100)}
                className="w-full optical-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Exposure Compensation (EV)</span>
                <span className="font-mono-tabular text-zinc-200">
                  {customExposure >= 0 ? `+${customExposure.toFixed(1)}` : customExposure.toFixed(1)} EV
                </span>
              </div>
              <input
                type="range"
                min={-1.5}
                max={1.5}
                step={0.1}
                value={customExposure}
                onChange={(e) => onChangeCustomExposure(Number(e.target.value))}
                className="w-full optical-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Silver Halide Grain</span>
                <span className="font-mono-tabular text-zinc-200">{Math.round(customGrain * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={Math.round(customGrain * 100)}
                onChange={(e) => onChangeCustomGrain(Number(e.target.value) / 100)}
                className="w-full optical-slider"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-zinc-400">Petzval Corner Vignette</span>
                <span className="font-mono-tabular text-zinc-200">{Math.round(customVignette * 100)}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={95}
                value={Math.round(customVignette * 100)}
                onChange={(e) => onChangeCustomVignette(Number(e.target.value) / 100)}
                className="w-full optical-slider"
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: TEMPORAL FIELD ARCHAEOLOGIST SCAN & AUDIO NARRATION */}
      {inspectorSection === 'archaeologist' && (
        <div className="flex flex-col gap-3">
          <div>
            <h2 className="text-sm font-semibold text-[#F4F4F0]">Temporal Field Telemetry</h2>
            <p className="text-xs text-zinc-400 mt-1">
              Synthesize an archival continuity report comparing the {selectedSite.pastYear} plate against the 2026 spatial baseline.
            </p>
          </div>

          <button
            type="button"
            onClick={onRequestFieldAnalysis}
            disabled={isAnalyzingField}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {isAnalyzingField
                ? 'Synthesizing Spatial Continuity...'
                : `Analyze ${selectedSite.pastYear} ⇄ 2026 Alignment`}
            </span>
          </button>

          {fieldAnalysisReport ? (
            <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800">
              <div>
                <div className="text-[11px] font-mono-tabular text-amber-400">
                  ARCHITECTURAL CONTINUITY
                </div>
                <p className="text-xs text-zinc-200 mt-1 leading-relaxed">
                  {fieldAnalysisReport.architecturalContinuity}
                </p>
              </div>

              <div>
                <div className="text-[11px] font-mono-tabular text-zinc-400">
                  SPECTRAL & OPTICAL OBSERVATIONS
                </div>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                  {fieldAnalysisReport.opticalNotes}
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-zinc-900 border border-zinc-800">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono-tabular text-emerald-400">
                    SONIC TIME-CAPSULE NARRATION
                  </span>
                  <button
                    type="button"
                    onClick={() => onPlayVoiceNarration(fieldAnalysisReport.narrationScript)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs font-medium text-[#F4F4F0] cursor-pointer"
                  >
                    {isPlayingNarration ? (
                      <>
                        <Square className="w-3 h-3 text-amber-400 fill-amber-400" />
                        <span>Stop Audio</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Play Field Audio</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs italic text-zinc-300 mt-2 leading-relaxed font-serif-editorial text-sm">
                  “{fieldAnalysisReport.narrationScript}”
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800/80 text-xs text-zinc-400 leading-relaxed">
              Run a field scan to inspect invariant structural fiducials, shadows, and generate an archival audio log for this portal.
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
