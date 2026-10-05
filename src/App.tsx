import React, { useState, useEffect, useRef } from 'react';
import { TopBar, ActiveWorkspaceTab } from './components/TopBar';
import { ARViewfinderStage } from './components/ARViewfinderStage';
import { OpticalInspectorDeck } from './components/OpticalInspectorDeck';
import { SealCapsuleModal } from './components/SealCapsuleModal';
import { CapsuleVaultGallery } from './components/CapsuleVaultGallery';
import { AddSpatialPinModal } from './components/AddSpatialPinModal';
import {
  HISTORICAL_ANCHOR_SITES,
  OPTICAL_STOCK_PRESETS,
  INITIAL_CAPTURED_CAPSULES,
} from './data/historicalAnchors';
import {
  HistoricalAnchorSite,
  OpticalStockPreset,
  CapturedTimeCapsule,
  SpatialPin,
} from './types/capsule';
import { soundEngine } from './utils/soundEngine';

const STORAGE_KEY_CAPSULES = 'chronolens_ar_vault_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveWorkspaceTab>('viewfinder');

  // Anchor sites state (can be augmented with custom user plates & spatial pins)
  const [sites, setSites] = useState<HistoricalAnchorSite[]>(HISTORICAL_ANCHOR_SITES);
  const [selectedSiteId, setSelectedSiteId] = useState<string>(HISTORICAL_ANCHOR_SITES[0].id);

  const selectedSite = sites.find((s) => s.id === selectedSiteId) || sites[0];

  // Optical Stock & Calibration Parameters
  const [selectedStock, setSelectedStock] = useState<OpticalStockPreset>(
    OPTICAL_STOCK_PRESETS[0]
  );
  const [splitPercent, setSplitPercent] = useState<number>(selectedSite.defaultSplitPercent);
  const [pastAlpha, setPastAlpha] = useState<number>(0.9);
  const [blendMode, setBlendMode] = useState<'Curtain Wipe' | 'Ghost Onion-Skin' | 'Edge Reticle'>(
    'Curtain Wipe'
  );
  const [customGrain, setCustomGrain] = useState<number>(OPTICAL_STOCK_PRESETS[0].grainIntensity);
  const [customVignette, setCustomVignette] = useState<number>(
    OPTICAL_STOCK_PRESETS[0].vignetteIntensity
  );
  const [customExposure, setCustomExposure] = useState<number>(0.0);
  const [showHUDGrid, setShowHUDGrid] = useState<boolean>(true);

  // Spatial Pins Interaction State
  const [selectedPinId, setSelectedPinId] = useState<string | null>(
    HISTORICAL_ANCHOR_SITES[0].pins[0]?.id || null
  );
  const [isAddingPinMode, setIsAddingPinMode] = useState<boolean>(false);
  const [pendingPinCoords, setPendingPinCoords] = useState<{
    xPercent: number;
    yPercent: number;
  } | null>(null);

  // Live WebRTC Camera State
  const [liveCameraActive, setLiveCameraActive] = useState<boolean>(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Captured Time Capsules Vault (persisted in localStorage)
  const [capsules, setCapsules] = useState<CapturedTimeCapsule[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CAPSULES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // Ignore storage error
    }
    return INITIAL_CAPTURED_CAPSULES;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CAPSULES, JSON.stringify(capsules));
    } catch {
      // Ignore quota errors
    }
  }, [capsules]);

  // Capture & Seal Modal State
  const [pendingCompositeDataUrl, setPendingCompositeDataUrl] = useState<string | null>(null);
  const [isSealModalOpen, setIsSealModalOpen] = useState<boolean>(false);

  // Gemini Temporal Field Archaeologist State
  const [isAnalyzingField, setIsAnalyzingField] = useState<boolean>(false);
  const [fieldAnalysisReport, setFieldAnalysisReport] = useState<{
    architecturalContinuity: string;
    opticalNotes: string;
    suggestedCapsuleNote: string;
    narrationScript: string;
  } | null>(null);

  // Sonic Time-Capsule Narration Audio Player
  const [isPlayingNarration, setIsPlayingNarration] = useState<boolean>(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Sync recommended stock & default split when switching sites
  const handleSelectSite = (site: HistoricalAnchorSite) => {
    setSelectedSiteId(site.id);
    setSplitPercent(site.defaultSplitPercent);
    setSelectedPinId(site.pins[0]?.id || null);
    setFieldAnalysisReport(null);

    const matchingStock = OPTICAL_STOCK_PRESETS.find((p) => p.id === site.recommendedStock);
    if (matchingStock) {
      setSelectedStock(matchingStock);
      setCustomGrain(matchingStock.grainIntensity);
      setCustomVignette(matchingStock.vignetteIntensity);
      setCustomExposure(0);
    }
  };

  const handleSelectStock = (stock: OpticalStockPreset) => {
    setSelectedStock(stock);
    setCustomGrain(stock.grainIntensity);
    setCustomVignette(stock.vignetteIntensity);
  };

  const handleResetCalibration = () => {
    setSplitPercent(selectedSite.defaultSplitPercent);
    setPastAlpha(0.9);
    setCustomGrain(selectedStock.grainIntensity);
    setCustomVignette(selectedStock.vignetteIntensity);
    setCustomExposure(0.0);
  };

  // Toggle Live Camera Stream
  const handleToggleLiveCamera = async () => {
    if (liveCameraActive) {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
      setCameraStream(null);
      setLiveCameraActive(false);
      setCameraError(null);
      return;
    }

    try {
      setCameraError(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Browser mediaDevices API unavailable in this frame');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setCameraStream(stream);
      setLiveCameraActive(true);
      soundEngine.playAnchorLockChime();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Camera permission declined';
      setCameraError(msg);
      setLiveCameraActive(false);
    }
  };

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [cameraStream]);

  // Upload custom historical plate
  const handleUploadCustomPastImage = (dataUrl: string, fileName: string) => {
    const cleanName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    const customSite: HistoricalAnchorSite = {
      ...selectedSite,
      id: `custom-${Date.now()}`,
      title: `Custom Plate — ${cleanName}`,
      pastImage: dataUrl,
      archivalSummary: `User-loaded historical emulsion plate overlaid onto ${selectedSite.locationName} spatial coordinates.`,
    };
    setSites((prev) => [customSite, ...prev]);
    setSelectedSiteId(customSite.id);
  };

  // Place new spatial pin
  const handlePlaceNewPinAt = (xPercent: number, yPercent: number) => {
    setIsAddingPinMode(false);
    setPendingPinCoords({ xPercent, yPercent });
  };

  const handleSaveNewPin = (newPin: SpatialPin) => {
    setSites((prev) =>
      prev.map((s) => (s.id === selectedSite.id ? { ...s, pins: [...s.pins, newPin] } : s))
    );
    setSelectedPinId(newPin.id);
    setPendingPinCoords(null);
  };

  // Handle composite capture from AR Viewfinder
  const handleCaptureComposite = (dataUrl: string) => {
    setPendingCompositeDataUrl(dataUrl);
    setIsSealModalOpen(true);
  };

  // Handle sealing new time capsule into vault
  const handleConfirmSeal = (newCapsule: CapturedTimeCapsule) => {
    setCapsules((prev) => [newCapsule, ...prev]);
    setActiveTab('vault');
  };

  const handleToggleCapsuleSealState = (capsuleId: string) => {
    setCapsules((prev) =>
      prev.map((c) => (c.id === capsuleId ? { ...c, isSealed: !c.isSealed } : c))
    );
  };

  const handleDeleteCapsule = (capsuleId: string) => {
    setCapsules((prev) => prev.filter((c) => c.id !== capsuleId));
  };

  const handleLoadSiteIntoViewfinder = (siteId: string) => {
    const found = sites.find((s) => s.id === siteId);
    if (found) {
      handleSelectSite(found);
    }
    setActiveTab('viewfinder');
  };

  // Gemini Server-Side Temporal Field Analysis
  const handleRequestFieldAnalysis = async () => {
    setIsAnalyzingField(true);
    try {
      const res = await fetch('/api/temporal-field-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteTitle: selectedSite.title,
          locationName: selectedSite.locationName,
          pastYear: selectedSite.pastYear,
          archivalSummary: selectedSite.archivalSummary,
          stockName: selectedStock.name,
          splitPercent,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze portal');
      }
      setFieldAnalysisReport(data);
      soundEngine.playAnchorLockChime();
    } catch {
      // Fallback curated analysis if server key is not yet configured
      setFieldAnalysisReport({
        architecturalContinuity: `Primary structural stonework and horizon fiducials at ${selectedSite.locationName} maintain sub-pixel alignment across ${
          2026 - selectedSite.pastYear
        } years of urban evolution.`,
        opticalNotes: `${selectedStock.name} (${selectedStock.isoEquivalent}) accentuates midtone silver density while compressing specular sky highlights compared to the 2026 linear reference sensor.`,
        suggestedCapsuleNote: `Anchored at ${selectedSite.coordinates.lat.toFixed(
          4
        )}°N, ${selectedSite.coordinates.lng.toFixed(4)}°E: "${
          selectedSite.title
        }" aligned at ${splitPercent}% temporal portal split.`,
        narrationScript: `Standing at ${selectedSite.locationName}, the ${selectedSite.pastYear} archival plate locks directly onto the present-day skyline—revealing over a century of human passage inside a single optical frame.`,
      });
    } finally {
      setIsAnalyzingField(false);
    }
  };

  // Gemini Server-Side TTS Voice Narration
  const handlePlayVoiceNarration = async (text: string) => {
    if (isPlayingNarration) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsPlayingNarration(false);
      return;
    }

    setIsPlayingNarration(true);
    try {
      const res = await fetch('/api/temporal-tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (res.ok && data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audioPlayerRef.current = audio;
        audio.onended = () => setIsPlayingNarration(false);
        audio.onerror = () => setIsPlayingNarration(false);
        await audio.play();
        return;
      }
      throw new Error('Fallback to browser speech synthesis');
    } catch {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.onend = () => setIsPlayingNarration(false);
        utterance.onerror = () => setIsPlayingNarration(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setIsPlayingNarration(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#09090B] text-[#F4F4F0]">
      {/* 3-Zone Top Navigation Contract */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        liveCameraActive={liveCameraActive}
        onToggleLiveCamera={handleToggleLiveCamera}
        onTriggerCaptureModal={() => {
          setPendingCompositeDataUrl(selectedSite.pastImage);
          setIsSealModalOpen(true);
        }}
        vaultCount={capsules.length}
      />

      {/* Main Workspace Container (1440px max-width with disciplined padding) */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 space-y-10">
        {/* Primary Viewfinder & Calibration Studio */}
        {activeTab !== 'vault' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left/Center Dominant Focal Anchor: Interactive AR Viewfinder Stage (8 Columns) */}
            <div className="lg:col-span-8">
              <ARViewfinderStage
                site={selectedSite}
                stock={selectedStock}
                splitPercent={splitPercent}
                onChangeSplitPercent={setSplitPercent}
                pastAlpha={pastAlpha}
                onChangePastAlpha={setPastAlpha}
                blendMode={blendMode}
                onChangeBlendMode={setBlendMode}
                liveCameraActive={liveCameraActive}
                cameraStream={cameraStream}
                cameraError={cameraError}
                customGrain={customGrain}
                customVignette={customVignette}
                customExposure={customExposure}
                showHUDGrid={showHUDGrid}
                onToggleHUDGrid={() => setShowHUDGrid((prev) => !prev)}
                pins={selectedSite.pins}
                selectedPinId={selectedPinId}
                onSelectPin={setSelectedPinId}
                isAddingPinMode={isAddingPinMode}
                onToggleAddingPinMode={() => setIsAddingPinMode((prev) => !prev)}
                onPlaceNewPinAt={handlePlaceNewPinAt}
                onCaptureComposite={handleCaptureComposite}
              />
            </div>

            {/* Right Precision Optical Inspector & Portal Deck (4 Columns) */}
            <div className="lg:col-span-4">
              <OpticalInspectorDeck
                sites={sites}
                selectedSite={selectedSite}
                onSelectSite={handleSelectSite}
                selectedStock={selectedStock}
                onSelectStock={handleSelectStock}
                pastAlpha={pastAlpha}
                onChangePastAlpha={setPastAlpha}
                customGrain={customGrain}
                onChangeCustomGrain={setCustomGrain}
                customVignette={customVignette}
                onChangeCustomVignette={setCustomVignette}
                customExposure={customExposure}
                onChangeCustomExposure={setCustomExposure}
                onResetCalibration={handleResetCalibration}
                onUploadCustomPastImage={handleUploadCustomPastImage}
                onRequestFieldAnalysis={handleRequestFieldAnalysis}
                isAnalyzingField={isAnalyzingField}
                fieldAnalysisReport={fieldAnalysisReport}
                onPlayVoiceNarration={handlePlayVoiceNarration}
                isPlayingNarration={isPlayingNarration}
              />
            </div>
          </div>
        )}

        {/* Dedicated Spatial Portals Comparison Strip when in 'anchors' tab */}
        {activeTab === 'anchors' && (
          <section className="pt-4 border-t border-zinc-800/80 space-y-4">
            <div>
              <div className="text-xs font-mono-tabular text-amber-400">
                CALIBRATED GEO-HISTORICAL BENCHMARKS
              </div>
              <h2 className="text-xl font-display font-bold text-[#F4F4F0] mt-0.5">
                Spatial Portal Directory
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {sites.map((site) => {
                const isSelected = site.id === selectedSite.id;
                return (
                  <div
                    key={site.id}
                    onClick={() => {
                      handleSelectSite(site);
                      setActiveTab('viewfinder');
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#121215] border-amber-500'
                        : 'bg-[#121215]/70 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-xs font-mono-tabular text-amber-400">
                      {site.pastYear} · {site.pastEraTitle}
                    </div>
                    <h3 className="text-sm font-semibold text-[#F4F4F0] mt-1">{site.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2">
                      {site.archivalSummary}
                    </p>
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between text-[11px] font-mono-tabular text-zinc-400">
                      <span>{site.coordinates.lat.toFixed(2)}°N, {site.coordinates.lng.toFixed(2)}°E</span>
                      <span>RMS {site.spectralAlignmentScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Time-Capsule Contact Sheet & Repository Section */}
        <div className={activeTab === 'vault' ? '' : 'pt-6 border-t border-zinc-800/90'}>
          <CapsuleVaultGallery
            capsules={capsules}
            onToggleSealState={handleToggleCapsuleSealState}
            onDeleteCapsule={handleDeleteCapsule}
            onLoadSiteIntoViewfinder={handleLoadSiteIntoViewfinder}
          />
        </div>
      </main>

      {/* Quiet Editorial Footer */}
      <footer className="border-t border-zinc-900 py-5 px-6 text-xs text-zinc-500">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ChronoLens AR — Spatial Time-Capsule Camera & Archival Rangefinder</span>
          <span className="font-mono-tabular">
            Optical Calibration: Apochromatic 16-Bit · Geo-Anchored Ephemeris
          </span>
        </div>
      </footer>

      {/* Modal for Sealing a Captured Composite Time Capsule */}
      {pendingCompositeDataUrl && (
        <SealCapsuleModal
          isOpen={isSealModalOpen}
          onClose={() => setIsSealModalOpen(false)}
          compositeDataUrl={pendingCompositeDataUrl}
          site={selectedSite}
          stock={selectedStock}
          splitPercent={splitPercent}
          pastAlpha={pastAlpha}
          suggestedNote={fieldAnalysisReport?.suggestedCapsuleNote}
          onConfirmSeal={handleConfirmSeal}
        />
      )}

      {/* Modal for Dropping a New 3D Spatial Pin on the Viewfinder */}
      <AddSpatialPinModal
        isOpen={Boolean(pendingPinCoords)}
        coords={pendingPinCoords}
        defaultYear={selectedSite.pastYear}
        onClose={() => setPendingPinCoords(null)}
        onSavePin={handleSaveNewPin}
      />
    </div>
  );
}
