export type OpticalStockId =
  | 'daguerreotype-1890'
  | 'silver-gelatin-1925'
  | 'kodachrome-1968'
  | 'vhs-camcorder-1994'
  | 'clean-optical-2026'
  | 'chrono-vector-2085';

export interface OpticalStockPreset {
  id: OpticalStockId;
  name: string;
  eraLabel: string;
  yearRange: string;
  isoEquivalent: string;
  dynamicRange: string;
  focalCharacter: string;
  description: string;
  filterCss: {
    sepia: number;
    contrast: number;
    brightness: number;
    saturate: number;
    hueRotate: number;
  };
  grainIntensity: number;
  vignetteIntensity: number;
  chromaticShift: number;
  scanlineOpacity: number;
  tintOverlay: string;
  frameBorderStyle: string;
}

export interface SpatialPin {
  id: string;
  xPercent: number; // 15 to 85
  yPercent: number; // 20 to 80
  title: string;
  timestampLabel: string;
  year: number;
  depthMeters: number;
  azimuthDeg: number;
  elevationDeg: number;
  note: string;
  author: string;
  lockedUntilYear?: number;
  isUnlocked: boolean;
  category: 'Architecture' | 'Personal Memory' | 'Historical Event' | 'Future Message';
}

export interface HistoricalAnchorSite {
  id: string;
  title: string;
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
    altitudeM: number;
    headingDeg: number;
  };
  pastYear: number;
  pastEraTitle: string;
  pastImage: string;
  presentImage: string;
  recommendedStock: OpticalStockId;
  archivalSummary: string;
  opticalNotes: string;
  spectralAlignmentScore: number;
  defaultSplitPercent: number;
  pins: SpatialPin[];
}

export interface CapturedTimeCapsule {
  id: string;
  title: string;
  recipientOrPublic: string;
  messageNote: string;
  capturedAtIso: string;
  originYear: number;
  unlockDateIso: string;
  unlockYear: number;
  isSealed: boolean;
  siteId: string;
  siteName: string;
  coordinates: {
    lat: number;
    lng: number;
    headingDeg: number;
  };
  stockUsed: OpticalStockId;
  splitRatio: number;
  compositeDataUrl: string;
  pastOverlayAlpha: number;
  fieldNoteSummary: string;
  pinCount: number;
}
