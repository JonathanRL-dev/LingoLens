import { describe, expect, it } from 'vitest';
import { mapBox } from './boxMapping';

describe('mapBox', () => {
  it('keeps coordinates unchanged when video and display have the same aspect ratio', () => {
    expect(mapBox([10, 20, 30, 40], { w: 640, h: 480 }, { w: 320, h: 240 })).toEqual([
      5, 10, 15, 20,
    ]);
  });

  it('centers a taller display with horizontal cropping', () => {
    expect(mapBox([0, 0, 640, 480], { w: 640, h: 480 }, { w: 300, h: 600 })).toEqual([
      -250, 0, 800, 600,
    ]);
  });

  it('centers a wider display with vertical cropping', () => {
    expect(mapBox([0, 0, 640, 480], { w: 640, h: 480 }, { w: 900, h: 300 })).toEqual([
      0, -187.5, 900, 675,
    ]);
  });
});
