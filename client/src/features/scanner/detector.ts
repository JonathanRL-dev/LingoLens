export interface Detection {
  label: string;
  confidence: number;
  box?: [number, number, number, number];
}

export interface Detector {
  load(): Promise<void>;
  detect(source: HTMLVideoElement | HTMLImageElement): Promise<Detection[]>;
}
