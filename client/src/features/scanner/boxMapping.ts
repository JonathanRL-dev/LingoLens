export type Box = [x: number, y: number, w: number, h: number];

/** Maps video-pixel boxes into the cropped display area to correct object-fit: cover misalignment. */
export function mapBox(
  box: Box,
  video: { w: number; h: number },
  display: { w: number; h: number },
): Box {
  const scale = Math.max(display.w / video.w, display.h / video.h);
  const offsetX = (display.w - video.w * scale) / 2;
  const offsetY = (display.h - video.h * scale) / 2;
  const [x, y, w, h] = box;

  return [x * scale + offsetX, y * scale + offsetY, w * scale, h * scale];
}
