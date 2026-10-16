import type { Detector, Detection } from './detector';

/** Reserved implementation for a later phase. */
export class MobileNetDetector implements Detector {
  async load(): Promise<void> {
    throw new Error('NotImplemented');
  }

  async detect(): Promise<Detection[]> {
    throw new Error('NotImplemented');
  }
}
