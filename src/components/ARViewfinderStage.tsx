import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Camera,
  Crosshair,
  Eye,
  Layers,
  Lock,
  Unlock,
  MapPin,
  Plus,
  RotateCcw,
  Maximize2,
  Sliders,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { HistoricalAnchorSite, OpticalStockPreset, SpatialPin } from '../types/capsule';
import { soundEngine } from '../utils/soundEngine';

interface ARViewfinderStageProps {
  site: HistoricalAnchorSite;
  stock: OpticalStockPreset;
  splitPercent: number;
  onChangeSplitPercent: (val: number) => void;
  pastAlpha: number;
  onChangePastAlpha: (val: number) => void;
  blendMode: 'Curtain Wipe' | 'Ghost Onion-Skin' | 'Edge Reticle';
  onChangeBlendMode: (mode: 'Curtain Wipe' | 'Ghost Onion-Skin' | 'Edge Reticle') => void;
  liveCameraActive: boolean;
  cameraStream: MediaStream | null;
  cameraError: string | null;
  customGrain: number;
  customVignette: number;
  customExposure: number;
  showHUDGrid: boolean;
  onToggleHUDGrid: () => void;
  pins: SpatialPin[];
  selectedPinId: string | null;
  onSelectPin: (pinId: string | null) => void;
  isAddingPinMode: boolean;
  onToggleAddingPinMode: () => void;
  onPlaceNewPinAt: (xPercent: number, yPercent: number) => void;
  onCaptureComposite: (dataUrl: string) => void;
}

export const ARViewfinderStage: React.FC<ARViewfinderStageProps> = ({
  site,
  stock,
  splitPercent,
  onChangeSplitPercent,
  pastAlpha,
  onChangePastAlpha,
  blendMode,
  onChangeBlendMode,
  liveCameraActive,
  cameraStream,
  cameraError,
  customGrain,
  customVignette,
  customExposure,
  showHUDGrid,
  onToggleHUDGrid,
  pins,
  selectedPinId,
  onSelectPin,
  isAddingPinMode,
  onToggleAddingPinMode,
  onPlaceNewPinAt,
  onCaptureComposite,
}) => {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [cursorCoords, setCursorCoords] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [shutterFlash, setShutterFlash] = useState(false);
  const [pastImgError, setPastImgError] = useState(false);
  const [presentImgError, setPresentImgError] = useState(false);

  // Reset image error states when site changes
  useEffect(() => {
    setPastImgError(false);
    setPresentImgError(false);
  }, [site.id]);

  // Attach live camera stream to video element
  useEffect(() => {
    if (videoRef.current && cameraStream && liveCameraActive) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraStream, liveCameraActive]);

  // Handle curtain wipe pointer dragging
  const updateSplitFromClientX = useCallback(
    (clientX: number) => {
      if (!viewportRef.current) return;
      const rect = viewportRef.current.getBoundingClientRect();
      const relX = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.max(4, Math.min(96, Math.round(relX)));
      if (clamped !== splitPercent) {
        onChangeSplitPercent(clamped);
        if (clamped % 5 === 0) {
          soundEngine.playRangefinderTick();
        }
      }
    },
    [onChangeSplitPercent, splitPercent]
  );

  useEffect(() => {
    if (!isDraggingSplit) return;
    const handleMove = (e: MouseEvent) => updateSplitFromClientX(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) updateSplitFromClientX(e.touches[0].clientX);
    };
    const handleUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDraggingSplit, updateSplitFromClientX]);

  // Handle viewport click for dropping spatial pins
  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const xPct = Math.round(((e.clientX - rect.left) / rect.width) * 1000) / 10;
    const yPct = Math.round(((e.clientY - rect.top) / rect.height) * 1000) / 10;

    if (isAddingPinMode) {
      soundEngine.playAnchorLockChime();
      onPlaceNewPinAt(Math.max(8, Math.min(92, xPct)), Math.max(12, Math.min(88, yPct)));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!viewportRef.current) return;
    const rect = viewportRef.current.getBoundingClientRect();
    const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setCursorCoords({ x: xPct, y: yPct });
  };

  // Compute CSS filter string for historical optical stock + user exposure adjustments
  const effectiveBrightness = stock.filterCss.brightness + customExposure * 0.25;
  const pastLayerFilter = `sepia(${stock.filterCss.sepia}) contrast(${stock.filterCss.contrast}) brightness(${effectiveBrightness.toFixed(
    2
  )}) saturate(${stock.filterCss.saturate}) hue-rotate(${stock.filterCss.hueRotate}deg)`;

  // Synthesize high-resolution composite snapshot on HTML5 Canvas when shutter is pressed
  const triggerShutterCapture = async () => {
    soundEngine.playMechanicalShutter();
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 180);

    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Helper to load image safely
    const loadImage = (src: string): Promise<HTMLImageElement | null> =>
      new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      });

    // 1. Draw Present Base Layer (Live Webcam or Present Reference Photo)
    ctx.fillStyle = '#09090B';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (liveCameraActive && videoRef.current && videoRef.current.readyState >= 2) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    } else {
      const presentImg = await loadImage(site.presentImage);
      if (presentImg) {
        ctx.drawImage(presentImg, 0, 0, canvas.width, canvas.height);
      } else {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#18181B');
        grad.addColorStop(1, '#27272A');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }

    // 2. Draw Historical Past Layer with Split / Alpha & Optical Stock Filter
    const pastImg = await loadImage(site.pastImage);
    if (pastImg) {
      ctx.save();
      ctx.filter = pastLayerFilter;
      ctx.globalAlpha = blendMode === 'Ghost Onion-Skin' ? pastAlpha : Math.min(1, pastAlpha + 0.1);

      const splitX =
        blendMode === 'Curtain Wipe' ? Math.round((splitPercent / 100) * canvas.width) : canvas.width;

      ctx.beginPath();
      ctx.rect(0, 0, splitX, canvas.height);
      ctx.clip();
      ctx.drawImage(pastImg, 0, 0, canvas.width, canvas.height);

      // Tint overlay inside historical region
      ctx.fillStyle = stock.tintOverlay;
      ctx.fillRect(0, 0, splitX, canvas.height);
      ctx.restore();

      // Draw vertical amber portal line if Curtain Wipe
      if (blendMode === 'Curtain Wipe') {
        ctx.save();
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(splitX, 0);
        ctx.lineTo(splitX, canvas.height);
        ctx.stroke();
        ctx.restore();
      }
    }

    // 3. Draw Vignette & Optical Frame Burn-in Metadata
    const radGrad = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      canvas.height * 0.28,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width * 0.65
    );
    radGrad.addColorStop(0, 'rgba(0,0,0,0)');
    radGrad.addColorStop(1, `rgba(0,0,0,${Math.min(0.85, customVignette)})`);
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bottom optical film-edge telemetry stamp
    ctx.fillStyle = 'rgba(9, 9, 11, 0.82)';
    ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height - 48);
    ctx.lineTo(canvas.width, canvas.height - 48);
    ctx.stroke();

    ctx.fillStyle = '#F59E0B';
    ctx.font = '600 13px "JetBrains Mono", monospace';
    ctx.fillText(
      `CHRONOLENS AR // ${site.pastYear} ⇄ 2026 // ${stock.name.toUpperCase()}`,
      24,
      canvas.height - 19
    );

    ctx.fillStyle = '#A1A1AA';
    ctx.textAlign = 'right';
    ctx.fillText(
      `LAT ${site.coordinates.lat.toFixed(4)}° N · LNG ${site.coordinates.lng.toFixed(4)}° E · HDG ${site.coordinates.headingDeg.toFixed(1)}°`,
      canvas.width - 24,
      canvas.height - 19
    );

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    onCaptureComposite(dataUrl);
  };

  const selectedPin = pins.find((p) => p.id === selectedPinId) || null;

  return (
    <div className="flex flex-col gap-3">
      {/* Top Optical Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-[#121215] border border-zinc-800/90 rounded-lg">
        <div className="flex items-center gap-3 text-xs font-mono-tabular text-zinc-300">
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
            ANCHOR LOCKED
          </span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span>
            EPOCH <strong className="text-amber-400">{site.pastYear}</strong> ⇄ <strong className="text-[#F4F4F0]">2026</strong>
          </span>
          <span aria-hidden="true" className="text-zinc-600">·</span>
          <span className="hidden sm:inline text-zinc-400">
            {site.coordinates.lat.toFixed(4)}° N, {site.coordinates.lng.toFixed(4)}° E
          </span>
          <span aria-hidden="true" className="hidden sm:inline text-zinc-600">·</span>
          <span className="hidden lg:inline text-zinc-400">
            AZIMUTH {site.coordinates.headingDeg.toFixed(1)}°
          </span>
        </div>

        {/* Blend Mode Segmented Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-zinc-900 border border-zinc-800 rounded-md">
          {(['Curtain Wipe', 'Ghost Onion-Skin', 'Edge Reticle'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                soundEngine.playRangefinderTick();
                onChangeBlendMode(mode);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                blendMode === mode
                  ? 'bg-amber-500 text-zinc-950 font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Main Optical Viewfinder Frame (16:9 Precision Viewport) */}
      <div
        ref={viewportRef}
        onClick={handleViewportClick}
        onMouseMove={handleMouseMove}
        className={`relative w-full aspect-video bg-[#050506] border border-zinc-800 rounded-xl overflow-hidden select-none shadow-2xl ${
          isAddingPinMode ? 'cursor-crosshair ring-2 ring-amber-500/70' : 'cursor-default'
        }`}
      >
        {/* LAYER 1: Present-Day Reality (Live Webcam Stream OR Present Reference Image) */}
        <div className="absolute inset-0 w-full h-full">
          {liveCameraActive && cameraStream ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : !presentImgError ? (
            <img
              src={site.presentImage}
              alt={`${site.title} present-day reference`}
              referrerPolicy="no-referrer"
              onError={() => setPresentImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex flex-col items-center justify-center p-8 text-center">
              <Camera className="w-10 h-10 text-zinc-600 mb-2" />
              <p className="text-sm font-medium text-zinc-300">{site.locationName} — Present Baseline</p>
              <p className="text-xs font-mono-tabular text-zinc-500 mt-1">
                {site.coordinates.lat.toFixed(4)}° N · {site.coordinates.lng.toFixed(4)}° E
              </p>
            </div>
          )}

          {/* Present Layer Label Badge (Top Right) */}
          <div className="absolute top-3.5 right-4 z-20 pointer-events-none bg-zinc-950/80 backdrop-blur-md border border-zinc-700/80 px-3 py-1 rounded text-xs font-mono-tabular text-zinc-200">
            {liveCameraActive ? 'LIVE SENSOR · 2026' : 'PRESENT BASELINE · 2026'}
          </div>
        </div>

        {/* LAYER 2: Historical Time-Capsule AR Overlay */}
        <div
          className="absolute inset-0 w-full h-full pointer-events-none transition-[clip-path] duration-75"
          style={{
            clipPath:
              blendMode === 'Curtain Wipe'
                ? `polygon(0 0, ${splitPercent}% 0, ${splitPercent}% 100%, 0 100%)`
                : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
            opacity:
              blendMode === 'Curtain Wipe'
                ? Math.max(0.45, pastAlpha)
                : blendMode === 'Ghost Onion-Skin'
                ? pastAlpha
                : Math.min(0.82, pastAlpha),
            mixBlendMode: blendMode === 'Edge Reticle' ? 'luminosity' : 'normal',
          }}
        >
          {!pastImgError ? (
            <img
              src={site.pastImage}
              alt={`${site.title} archival plate (${site.pastYear})`}
              referrerPolicy="no-referrer"
              onError={() => setPastImgError(true)}
              style={{ filter: pastLayerFilter }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-950/50 via-zinc-900 to-zinc-950 flex flex-col items-center justify-center p-8 text-center">
              <Layers className="w-10 h-10 text-amber-500/70 mb-2" />
              <p className="text-sm font-medium text-amber-200">
                {site.title} ({site.pastYear})
              </p>
            </div>
          )}

          {/* Historical Color Tint Overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: stock.tintOverlay }}
          />

          {/* Scanlines if VHS/LiDAR stock */}
          {stock.scanlineOpacity > 0 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                opacity: stock.scanlineOpacity,
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.55) 0px, rgba(0,0,0,0.55) 1px, transparent 1px, transparent 3px)',
              }}
            />
          )}

          {/* Historical Layer Label (Top Left) */}
          <div className="absolute top-3.5 left-4 z-20 pointer-events-none bg-zinc-950/85 backdrop-blur-md border border-amber-500/50 px-3 py-1 rounded text-xs font-mono-tabular text-amber-300">
            ARCHIVAL LAYER · {site.pastYear} · {stock.name.toUpperCase()}
          </div>
        </div>

        {/* Optical Vignette & Film Grain Texture Layer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, transparent 42%, rgba(5,5,7,${Math.min(
              0.88,
              customVignette
            )}) 100%)`,
          }}
        />
        {customGrain > 0.02 && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay"
            style={{
              opacity: Math.min(0.45, customGrain * 0.65),
              backgroundImage: `radial-gradient(rgba(255,255,255,0.22) 1px, transparent 0)`,
              backgroundSize: '3px 3px',
            }}
          />
        )}

        {/* Precision Optical Rangefinder Reticle & Grid */}
        {showHUDGrid && (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 1000 562.5"
            preserveAspectRatio="none"
          >
            {/* Rule of thirds ultra-fine hairlines */}
            <line x1="333.3" y1="0" x2="333.3" y2="562.5" stroke="rgba(244,244,240,0.12)" strokeWidth="0.75" />
            <line x1="666.6" y1="0" x2="666.6" y2="562.5" stroke="rgba(244,244,240,0.12)" strokeWidth="0.75" />
            <line x1="0" y1="187.5" x2="1000" y2="187.5" stroke="rgba(244,244,240,0.12)" strokeWidth="0.75" />
            <line x1="0" y1="375" x2="1000" y2="375" stroke="rgba(244,244,240,0.12)" strokeWidth="0.75" />

            {/* Corner Fiducial Brackets */}
            <path d="M 28 58 L 28 28 L 58 28" fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth="1.5" />
            <path d="M 972 58 L 972 28 L 942 28" fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth="1.5" />
            <path d="M 28 504 L 28 534 L 58 534" fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth="1.5" />
            <path d="M 972 504 L 972 534 L 942 534" fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth="1.5" />

            {/* Center Split-Image Rangefinder Circle */}
            <circle
              cx="500"
              cy="281.25"
              r="38"
              fill="none"
              stroke="rgba(245,158,11,0.45)"
              strokeWidth="1"
              strokeDasharray="4 3"
            />
            <circle cx="500" cy="281.25" r="3" fill="rgba(245,158,11,0.8)" />
            <line x1="448" y1="281.25" x2="478" y2="281.25" stroke="rgba(245,158,11,0.55)" strokeWidth="1" />
            <line x1="522" y1="281.25" x2="552" y2="281.25" stroke="rgba(245,158,11,0.55)" strokeWidth="1" />
          </svg>
        )}

        {/* Interactive Curtain Wipe Divider Handle */}
        {blendMode === 'Curtain Wipe' && (
          <div
            style={{ left: `${splitPercent}%` }}
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            role="slider"
            aria-label="Temporal Portal Split Curtain"
            aria-valuemin={4}
            aria-valuemax={96}
            aria-valuenow={splitPercent}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') onChangeSplitPercent(Math.max(4, splitPercent - 2));
              if (e.key === 'ArrowRight') onChangeSplitPercent(Math.min(96, splitPercent + 2));
            }}
            className="absolute top-0 bottom-0 -ml-4 w-8 z-20 flex flex-col items-center justify-center cursor-ew-resize group focus:outline-none"
          >
            {/* Amber Laser Line */}
            <div className="w-0.5 h-full bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.9)]" />

            {/* Tactile Rangefinder Handle */}
            <div className="absolute top-1/2 -translate-y-1/2 px-2 py-1.5 rounded bg-zinc-950/95 border border-amber-400 text-amber-400 shadow-lg flex items-center gap-1 text-[11px] font-mono-tabular group-hover:scale-110 transition-transform">
              <span>◂</span>
              <span>{splitPercent}%</span>
              <span>▸</span>
            </div>
          </div>
        )}

        {/* Spatial AR Anchor Pins Overlaid in 3D Viewport Space */}
        <div className="absolute inset-0 z-20 pointer-events-none">
          {pins.map((pin) => {
            const isSelected = pin.id === selectedPinId;
            return (
              <button
                key={pin.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playRangefinderTick();
                  onSelectPin(isSelected ? null : pin.id);
                }}
                style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                className={`pointer-events-auto absolute -translate-x-1/2 -translate-y-1/2 group flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono-tabular transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500 text-zinc-950 border-amber-300 shadow-lg scale-105 z-30 font-semibold'
                    : pin.isUnlocked
                    ? 'bg-zinc-950/85 text-[#F4F4F0] border-amber-500/60 hover:border-amber-400 hover:bg-zinc-900'
                    : 'bg-zinc-950/85 text-sky-300 border-sky-500/60 hover:border-sky-400'
                }`}
              >
                {pin.isUnlocked ? (
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                ) : (
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="whitespace-nowrap">{pin.year}</span>
                <span className="hidden sm:inline max-w-[130px] truncate">{pin.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Spatial Pin Inspection HUD Drawer inside Viewfinder */}
        {selectedPin && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-14 left-4 right-4 sm:right-auto sm:w-96 z-30 bg-zinc-950/95 backdrop-blur-md border border-zinc-700/90 rounded-lg p-3.5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2 text-[11px] font-mono-tabular text-amber-400">
                  <span>{selectedPin.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedPin.timestampLabel}</span>
                </div>
                <h4 className="text-sm font-semibold text-[#F4F4F0] mt-0.5">{selectedPin.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => onSelectPin(null)}
                className="text-xs text-zinc-400 hover:text-white px-1.5 py-0.5 rounded"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-zinc-300 mt-2 leading-relaxed">{selectedPin.note}</p>
            <div className="flex items-center justify-between text-[11px] font-mono-tabular text-zinc-400 mt-2.5 pt-2 border-t border-zinc-800">
              <span>
                RANGE {selectedPin.depthMeters.toFixed(1)}m · AZ {selectedPin.azimuthDeg.toFixed(1)}°
              </span>
              <span>{selectedPin.author}</span>
            </div>
          </div>
        )}

        {/* Mode Notification Banner when Dropping a New Spatial Pin */}
        {isAddingPinMode && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 bg-amber-500 text-zinc-950 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-lg flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5" />
            <span>Click anywhere on the viewfinder to anchor a new spatial memory pin</span>
          </div>
        )}

        {/* Bottom Film-Edge Telemetry Ribbon inside Viewfinder */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black/90 via-black/75 to-transparent px-4 flex items-center justify-between text-[11px] font-mono-tabular text-zinc-300 z-20 pointer-events-none">
          <div className="flex items-center gap-3">
            <span className="text-amber-400">{stock.frameBorderStyle}</span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span className="hidden md:inline">ALIGNMENT {site.spectralAlignmentScore.toFixed(1)}%</span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              RETICLE X:{cursorCoords.x.toFixed(1)}% Y:{cursorCoords.y.toFixed(1)}%
            </span>
            <span aria-hidden="true" className="text-zinc-600">·</span>
            <span>PINS ({pins.length})</span>
          </div>
        </div>

        {/* Shutter Flash Overlay */}
        {shutterFlash && (
          <div className="absolute inset-0 bg-[#F4F4F0] z-40 pointer-events-none transition-opacity duration-150" />
        )}
      </div>

      {/* Live Camera Error Alert if user tried to enable webcam in a restricted sandbox */}
      {cameraError && (
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-rose-950/40 border border-rose-500/40 rounded-lg text-xs text-rose-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              Camera sensor notice: {cameraError}. Using calibrated present-day optical reference frame.
            </span>
          </div>
        </div>
      )}

      {/* Bottom Tactile Camera Deck: Temporal Split Scrubber + Shutter Release + Pin Dropper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center bg-[#121215] border border-zinc-800/90 rounded-xl p-4">
        {/* Left: Temporal Portal Scrubber */}
        <div className="lg:col-span-5 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400 font-medium">
              {blendMode === 'Curtain Wipe' ? 'Temporal Portal Curtain' : 'Historical Layer Opacity'}
            </span>
            <span className="font-mono-tabular text-amber-400 font-semibold">
              {blendMode === 'Curtain Wipe'
                ? `${splitPercent}% Past (${site.pastYear}) / ${100 - splitPercent}% Present`
                : `${Math.round(pastAlpha * 100)}% Density`}
            </span>
          </div>
          {blendMode === 'Curtain Wipe' ? (
            <input
              type="range"
              min={4}
              max={96}
              value={splitPercent}
              onChange={(e) => onChangeSplitPercent(Number(e.target.value))}
              aria-label="Temporal Portal Split Percentage"
              className="w-full optical-slider"
            />
          ) : (
            <input
              type="range"
              min={10}
              max={100}
              value={Math.round(pastAlpha * 100)}
              onChange={(e) => onChangePastAlpha(Number(e.target.value) / 100)}
              aria-label="Historical Layer Opacity"
              className="w-full optical-slider"
            />
          )}
        </div>

        {/* Center: Primary Mechanical Shutter Release Button */}
        <div className="lg:col-span-4 flex items-center justify-center">
          <button
            type="button"
            onClick={triggerShutterCapture}
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-zinc-950 font-semibold text-sm shadow-md transition-all cursor-pointer whitespace-nowrap"
          >
            <Camera className="w-4 h-4 stroke-[2.2]" />
            <span>Capture Composite Frame</span>
          </button>
        </div>

        {/* Right: Viewfinder Utility Controls */}
        <div className="lg:col-span-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onToggleAddingPinMode}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              isAddingPinMode
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : 'bg-zinc-900 border-zinc-700/80 text-zinc-300 hover:text-white hover:border-zinc-600'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAddingPinMode ? 'Cancel Pin' : 'Anchor Pin'}</span>
          </button>

          <button
            type="button"
            onClick={onToggleHUDGrid}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              showHUDGrid
                ? 'bg-zinc-800 border-zinc-600 text-[#F4F4F0]'
                : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
            }`}
          >
            HUD Reticle
          </button>
        </div>
      </div>
    </div>
  );
};
