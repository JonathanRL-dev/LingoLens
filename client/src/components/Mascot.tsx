import { useEffect, useRef, useState } from "react";

type Mood = "idle" | "searching" | "found" | "speaking" | "oops" | "cheer";
type Tint = "leaf" | "gold" | "signal" | "loading";

export interface Props {
  mood: Mood | "peek";
  tint?: Tint;
  size?: number;
  animated?: boolean;
  outline?: boolean;
}

type Point = [number, number];

interface ArmPose {
  angle: number;
  length: number;
  hand: "round" | "cup";
}

interface Pose {
  eyeR: number;
  turretR: number;
  pupilR: number;
  pupils: [Point, Point];
  headTilt: number;
  hatDrop: number;
  lift: number;
  armL: ArmPose;
  armR: ArmPose;
}

interface MotionClasses {
  root?: string;
  head?: string;
  tail?: string;
  blink?: string;
  pupilL?: string;
  pupilR?: string;
  armL?: string;
  armR?: string;
  tongue?: boolean;
}

const INK = "#1D2733";
const EYE = "#FFFFFF";
const HAT = "#E8D5A3";
const HAT_BAND = "#6B4A2F";
const TONGUE = "#F08CA0";
const LENS = "#4DB6C6";
const STICKERS = ["#F28C38", "#4DB6C6", "#F08CA0"];

const TINTS: Record<Tint, {body: string;belly: string;}> = {
  leaf: { body: "#6CC24A", belly: "#F1EDA6" },
  gold: { body: "#F4C430", belly: "#FFF1B8" },
  signal: { body: "#C2461F", belly: "#F2C6B4" },
  loading: { body: "#4DB6C6", belly: "#D6EEF2" }
};

const DEFAULT_TINT: Record<Mood, Tint> = {
  idle: "leaf",
  searching: "leaf",
  found: "gold",
  speaking: "leaf",
  oops: "signal",
  cheer: "gold"
};

const REST_L: ArmPose = { angle: 20, length: 15, hand: "round" };
const REST_R: ArmPose = { angle: -20, length: 15, hand: "round" };

const POSES: Record<Mood, Pose> = {
  idle: { eyeR: 11.5, turretR: 14, pupilR: 4.5, pupils: [[0, 0], [0, 0]], headTilt: 0, hatDrop: 0, lift: 0, armL: REST_L, armR: { angle: -140, length: 18, hand: "round" } },
  searching: { eyeR: 12.5, turretR: 15, pupilR: 4.5, pupils: [[-4, -2], [4, 2]], headTilt: 8, hatDrop: 0, lift: 0, armL: REST_L, armR: REST_R },
  found: { eyeR: 11.5, turretR: 14, pupilR: 4.5, pupils: [[1, -1.5], [1, -1.5]], headTilt: -4, hatDrop: 0, lift: -5, armL: { angle: 125, length: 17, hand: "round" }, armR: { angle: -125, length: 17, hand: "round" } },
  speaking: { eyeR: 11.5, turretR: 14, pupilR: 4.5, pupils: [[2.5, 0], [2.5, 0]], headTilt: -4, hatDrop: 0, lift: 0, armL: REST_L, armR: { angle: -149, length: 21, hand: "cup" } },
  oops: { eyeR: 9, turretR: 12.5, pupilR: 3.5, pupils: [[-2, 2], [-2, 2]], headTilt: 5, hatDrop: 6, lift: 0, armL: REST_L, armR: { angle: -160, length: 16, hand: "round" } },
  cheer: { eyeR: 11.5, turretR: 14, pupilR: 4.5, pupils: [[0, -1.5], [0, -1.5]], headTilt: 0, hatDrop: 0, lift: -3, armL: { angle: 150, length: 18, hand: "round" }, armR: { angle: -150, length: 18, hand: "round" } }
};

const EYES: [Point, Point] = [[46, 38], [72, 38]];
const SHOULDERS: [Point, Point] = [[44, 82], [74, 82]];

const idleMotion = (): MotionClasses => ({ blink: "lm-blink", tail: "lm-tail", pupilL: "lm-drift", pupilR: "lm-drift" });
const searchingMotion = (): MotionClasses => ({ pupilL: "lm-dart-a", pupilR: "lm-dart-b" });
const foundMotion = (): MotionClasses => ({ root: "lm-hop", tongue: true });
const speakingMotion = (): MotionClasses => ({});
const oopsMotion = (): MotionClasses => ({ head: "lm-shake" });
const cheerMotion = (): MotionClasses => ({ armL: "lm-bounce", armR: "lm-bounce lm-bounce-late" });

const MOTION: Record<Mood, () => MotionClasses> = {
  idle: idleMotion,
  searching: searchingMotion,
  found: foundMotion,
  speaking: speakingMotion,
  oops: oopsMotion,
  cheer: cheerMotion
};

const MOTION_CSS = `
.lm-fill{transition:fill 300ms cubic-bezier(0.23,1,0.32,1)}
.lm-anim .lm-blink{transform-box:fill-box;transform-origin:center;animation:lm-blink 4s linear infinite}
@keyframes lm-blink{0%,94%,100%{transform:scaleY(1)}97%{transform:scaleY(0.1)}}
.lm-anim .lm-tail{transform-box:view-box;transform-origin:72px 95px;animation:lm-sway 3s ease-in-out infinite alternate}
@keyframes lm-sway{from{transform:rotate(-4deg)}to{transform:rotate(4deg)}}
.lm-anim .lm-drift{animation:lm-drift 6s ease-in-out infinite}
@keyframes lm-drift{0%,100%{transform:translate(0,0)}33%{transform:translate(1.5px,-1px)}66%{transform:translate(-1.5px,1px)}}
.lm-anim .lm-dart-a{animation:lm-dart 1.6s cubic-bezier(0.23,1,0.32,1) infinite}
.lm-anim .lm-dart-b{animation:lm-dart 1.1s cubic-bezier(0.23,1,0.32,1) infinite reverse}
@keyframes lm-dart{0%,30%{transform:translateX(-2.5px)}50%,80%{transform:translateX(2.5px)}100%{transform:translateX(-2.5px)}}
.lm-anim .lm-hop{animation:lm-hop 400ms ease-in-out 1}
@keyframes lm-hop{0%,100%{transform:translateY(0)}45%{transform:translateY(-8px)}}
.lm-anim .lm-flick{transform-box:fill-box;transform-origin:left center;transform:scaleX(0);animation:lm-flick 300ms ease-out 350ms 1 both}
@keyframes lm-flick{0%{transform:scaleX(0)}45%,60%{transform:scaleX(1)}100%{transform:scaleX(0)}}
.lm-anim .lm-shake{transform-box:view-box;transform-origin:59px 74px;animation:lm-shake 300ms ease-in-out 1}
@keyframes lm-shake{0%,100%{transform:rotate(0)}20%{transform:rotate(-6deg)}50%{transform:rotate(5deg)}80%{transform:rotate(-3deg)}}
.lm-anim .lm-bounce{animation:lm-bounce 500ms ease-in-out infinite alternate}
.lm-anim .lm-bounce-late{animation-delay:250ms}
@keyframes lm-bounce{from{transform:translateY(0)}to{transform:translateY(-3px)}}
.lm-anim .lm-look-down{animation:lm-look-down 250ms cubic-bezier(0.23,1,0.32,1) 1 forwards}
@keyframes lm-look-down{from{transform:translate(0,0)}to{transform:translate(0,4px)}}
@media (prefers-reduced-motion: reduce){.lm-anim,.lm-anim *{animation:none !important}}
`;

export function Mascot({ mood, tint, size = 96, animated = true, outline = false }: Props) {
  if (mood === "peek") {
    return <MascotPeek tint={tint ?? "leaf"} size={size} animated={animated} outline={outline} />;
  }

  const colors = TINTS[tint ?? DEFAULT_TINT[mood]];
  const pose = POSES[mood];
  const motion = animated ? MOTION[mood]() : {};
  const simpleTail = size <= 48;

  const paint = (fill: string) => ({
    className: "lm-fill",
    style: { fill },
    stroke: outline ? INK : undefined,
    strokeWidth: outline ? 2.5 : undefined
  });

  const renderArm = (arm: ArmPose, shoulder: Point, className?: string) =>
  <g className={className}>
      <g transform={`translate(${shoulder[0]} ${shoulder[1]}) rotate(${arm.angle})`}>
        <rect x={-4.5} y={-3} width={9} height={arm.length} rx={4.5} {...paint(colors.body)} />
        {arm.hand === "cup" ?
      <ellipse cx={0} cy={arm.length - 2} rx={6} ry={4.5} {...paint(colors.body)} /> :

      <circle cx={0} cy={arm.length - 3} r={5.5} {...paint(colors.body)} />
      }
      </g>
    </g>;


  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      role="img"
      aria-label={`Chameleon mascot, ${mood}`}
      className={animated ? "lm-anim shrink-0" : "shrink-0"}
      style={{ overflow: "visible" }}>

      <style>{MOTION_CSS}</style>

      {mood === "cheer" ?
      <g>
          <rect x={42} y={114.5} width={34} height={4.5} rx={2.25} {...paint(STICKERS[0]!)} />
          <rect x={44} y={110} width={32} height={4.5} rx={2.25} {...paint(STICKERS[1]!)} />
          <rect x={42.5} y={105.5} width={32} height={4.5} rx={2.25} {...paint(STICKERS[2]!)} />
        </g> :
      null}

      <g className={motion.root}>
        <g transform={`translate(0 ${pose.lift})`}>
          <g className={motion.tail}>
            <rect x={68} y={90} width={20} height={10} rx={5} {...paint(colors.body)} />
            {simpleTail ?
            <>
                <circle cx={91} cy={87} r={11} {...paint(colors.body)} />
                <circle cx={92} cy={85.5} r={4} {...paint(colors.belly)} />
              </> :

            <>
                <circle cx={92} cy={88} r={13} {...paint(colors.body)} />
                <circle cx={93.5} cy={86.5} r={8.5} {...paint(colors.belly)} />
                <circle cx={92.5} cy={85} r={5} {...paint(colors.body)} />
                <circle cx={91.5} cy={84.5} r={2} {...paint(colors.belly)} />
              </>
            }
          </g>

          <rect x={46} y={96} width={11} height={12} rx={5.5} {...paint(colors.body)} />
          <rect x={61} y={96} width={11} height={12} rx={5.5} {...paint(colors.body)} />
          <ellipse cx={59} cy={88} rx={19} ry={15} {...paint(colors.body)} />
          <ellipse cx={60} cy={91} rx={11} ry={9} {...paint(colors.belly)} />

          <g className={motion.head}>
            <g transform={`rotate(${pose.headTilt} 59 74)`}>
              <ellipse cx={33} cy={44} rx={8} ry={12} transform="rotate(-25 33 44)" {...paint(colors.body)} />
              <ellipse cx={59} cy={56} rx={29} ry={22} {...paint(colors.body)} />

              {EYES.map(([ex, ey], index) => {
                const [px, py] = pose.pupils[index] ?? [0, 0];
                return (
                  <g key={index}>
                    <circle cx={ex} cy={ey} r={pose.turretR} {...paint(colors.body)} />
                    <g className={motion.blink}>
                      <circle cx={ex} cy={ey} r={pose.eyeR} {...paint(EYE)} />
                      <g className={index === 0 ? motion.pupilL : motion.pupilR}>
                        <circle cx={ex + px} cy={ey + py} r={pose.pupilR} {...paint(INK)} />
                      </g>
                    </g>
                  </g>);

              })}

              {mood === "searching" ?
              <circle cx={EYES[1][0]} cy={EYES[1][1]} r={pose.turretR + 2.5} fill="none" stroke={LENS} strokeWidth={2.5} /> :
              null}

              {mood === "oops" ?
              <g transform="translate(91 44)">
                  <rect x={-2.8} y={-2.8} width={5.6} height={5.6} rx={1} transform="translate(0 1) rotate(45)" {...paint(LENS)} />
                  <circle cx={0} cy={4} r={4} {...paint(LENS)} />
                </g> :
              null}

              {motion.tongue ?
              <rect className="lm-flick" x={64} y={64} width={14} height={5} rx={2.5} style={{ fill: TONGUE }} stroke={outline ? INK : undefined} strokeWidth={outline ? 2.5 : undefined} /> :
              null}

              <Mouth mood={mood} outline={outline} />

              <g transform={`translate(0 ${pose.hatDrop}) rotate(-10 59 20)`}>
                <rect x={44} y={4} width={30} height={18} rx={10} ry={8} {...paint(HAT)} />
                <rect x={44} y={10} width={30} height={5} rx={2.5} {...paint(HAT_BAND)} />
                <ellipse cx={59} cy={20} rx={31} ry={5.5} {...paint(HAT)} />
              </g>
            </g>
          </g>

          {renderArm(pose.armL, SHOULDERS[0], motion.armL)}
          {renderArm(pose.armR, SHOULDERS[1], motion.armR)}
        </g>
      </g>
    </svg>);

}

function Mouth({ mood, outline }: {mood: Mood;outline: boolean;}) {
  const line = { fill: "none", stroke: INK, strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  const solid = { stroke: outline ? INK : undefined, strokeWidth: outline ? 2.5 : undefined };

  switch (mood) {
    case "idle":
      return <path d="M54 63 Q60 68 66 63" {...line} />;
    case "searching":
      return <path d="M56 65 Q60 67 64 65" {...line} />;
    case "found":
      return <path d="M49 61 Q60 73 71 61" {...line} />;
    case "speaking":
      return <ellipse cx={60} cy={65} rx={3.5} ry={4} fill={INK} {...solid} />;
    case "oops":
      return <path d="M51 66 Q54.5 63.5 58 66 T65 66 T70 66" {...line} />;
    case "cheer":
      return (
        <g>
          <path d="M49 61 Q60 78 71 61 Z" fill={INK} strokeLinejoin="round" {...solid} />
          <ellipse cx={60} cy={70} rx={5} ry={4} fill={TONGUE} {...solid} />
        </g>);

  }
}

interface MascotPeekProps {
  tint: Tint;
  size: number;
  animated: boolean;
  outline: boolean;
}

const PEEK_EYES: [Point, Point] = [[47, 42], [73, 42]];

function MascotPeek({ tint, size, animated, outline }: MascotPeekProps) {
  const colors = TINTS[tint];
  const previousTint = useRef(tint);
  const [lookDown, setLookDown] = useState(false);

  useEffect(() => {
    if (previousTint.current === "loading" && tint === "leaf") {
      setLookDown(true);
    } else if (tint === "loading") {
      setLookDown(false);
    }
    previousTint.current = tint;
  }, [tint]);

  const paint = (fill: string) => ({
    className: "lm-fill",
    style: { fill },
    stroke: outline ? INK : undefined,
    strokeWidth: outline ? 2.5 : undefined
  });

  const pupilClass = (index: number) => {
    if (!animated) return undefined;
    if (lookDown) return "lm-look-down";
    return index === 0 ? "lm-dart-a" : "lm-dart-b";
  };

  return (
    <svg
      width={size}
      height={size * 0.58}
      viewBox="0 0 120 70"
      role="img"
      aria-label="Chameleon mascot, peek"
      className={animated ? "lm-anim block shrink-0" : "block shrink-0"}
      style={{ overflow: "hidden" }}>

      <style>{MOTION_CSS}</style>

      <ellipse cx={34} cy={50} rx={8} ry={12} transform="rotate(-25 34 50)" {...paint(colors.body)} />
      <ellipse cx={60} cy={64} rx={30} ry={22} {...paint(colors.body)} />

      {PEEK_EYES.map(([ex, ey], index) =>
      <g key={index}>
          <circle cx={ex} cy={ey} r={14} {...paint(colors.body)} />
          <g className={animated ? "lm-blink" : undefined}>
            <circle cx={ex} cy={ey} r={11.5} {...paint(EYE)} />
            <g className={pupilClass(index)}>
              <circle cx={ex} cy={ey} r={4.5} {...paint(INK)} />
            </g>
          </g>
        </g>
      )}

      <g transform="rotate(-10 60 24)">
        <rect x={45} y={6} width={30} height={20} rx={10} ry={8} {...paint(HAT)} />
        <rect x={45} y={12} width={30} height={5} rx={2.5} {...paint(HAT_BAND)} />
        <ellipse cx={60} cy={24} rx={31} ry={5.5} {...paint(HAT)} />
      </g>

      <rect x={27} y={50} width={18} height={24} rx={8} {...paint(colors.body)} />
      <rect x={75} y={50} width={18} height={24} rx={8} {...paint(colors.body)} />
    </svg>);

}

const SHEET_MOODS: Mood[] = ["idle", "searching", "found", "speaking", "oops", "cheer"];
const SHEET_TINTS: Tint[] = ["leaf", "gold", "signal", "loading"];
const SHEET_SIZES = [40, 64, 96, 160];
const SHEET_SURFACES = [
{ name: "Paper", className: "bg-paper border border-ink/15", labelClass: "text-muted" },
{ name: "Card", className: "bg-card border border-ink/15", labelClass: "text-muted" },
{ name: "Dark", className: "bg-[var(--camera-dark)]", labelClass: "text-white" }];


export default function MascotAssetSheet() {
  return (
    <main className="min-h-screen w-full bg-paper px-6 py-12 font-body text-ink md:px-12">
      <div className="mx-auto flex max-w-5xl flex-col gap-14">
        <h1 className="font-display text-[32px] font-extrabold leading-tight">Chameleon mascot</h1>

        <section aria-labelledby="sheet-moods" className="flex flex-col gap-6">
          <h2 id="sheet-moods" className="font-display text-[22px] font-bold">Moods</h2>
          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3">
            {SHEET_MOODS.map((mood) =>
            <figure key={mood} className="flex flex-col items-center gap-3">
                <Mascot mood={mood} size={160} />
                <figcaption className="text-[14px]">{mood}</figcaption>
              </figure>
            )}
          </div>
        </section>

        <section aria-labelledby="sheet-tints" className="flex flex-col gap-6">
          <h2 id="sheet-tints" className="font-display text-[22px] font-bold">Tints</h2>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {SHEET_TINTS.map((tint) =>
            <figure key={tint} className="flex flex-col items-center gap-3">
                <Mascot mood="idle" tint={tint} size={96} />
                <figcaption className="text-[14px]">{tint}</figcaption>
              </figure>
            )}
          </div>
        </section>

        <section aria-labelledby="sheet-sizes" className="flex flex-col gap-6">
          <h2 id="sheet-sizes" className="font-display text-[22px] font-bold">Sizes</h2>
          <div className="flex flex-col gap-4">
            {SHEET_SURFACES.map((surface) =>
            <div key={surface.name} className={`flex flex-col gap-5 rounded-card px-6 py-6 ${surface.className}`}>
                <p className={`text-[14px] ${surface.labelClass}`}>{surface.name}</p>
                <div className="flex flex-wrap items-end gap-10">
                  {SHEET_SIZES.map((size) =>
                <figure key={size} className="flex flex-col items-center gap-3">
                      <Mascot mood="idle" size={size} />
                      <figcaption className={`text-[14px] ${surface.labelClass}`}>{size}px</figcaption>
                    </figure>
                )}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>);

}
