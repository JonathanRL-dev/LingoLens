import type { Detection, Detector } from './detector';

interface CocoPrediction {
  class: string;
  score: number;
  bbox: [number, number, number, number];
}

interface CocoModel {
  detect(source: HTMLVideoElement | HTMLImageElement): Promise<CocoPrediction[]>;
}

/** COCO-SSD backed by model assets served from this application's public directory. */
export class CocoDetector implements Detector {
  private model: CocoModel | null = null;

  async load(): Promise<void> {
    const tf = await import('@tensorflow/tfjs');
    await tf.ready();
    const cocoSsd = await import('@tensorflow-models/coco-ssd');
    this.model = await cocoSsd.load({
      base: 'lite_mobilenet_v2',
      modelUrl: '/models/coco-ssd/model.json',
    });
  }

  async detect(source: HTMLVideoElement | HTMLImageElement): Promise<Detection[]> {
    if (!this.model) throw new Error('DetectorNotLoaded');
    const predictions = await this.model.detect(source);
    return predictions.map(({ class: label, score: confidence, bbox }) => ({
      label,
      confidence,
      box: bbox,
    }));
  }
}
