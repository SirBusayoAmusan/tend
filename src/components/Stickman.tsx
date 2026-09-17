import type { ReactNode } from 'react'

/**
 * Stick-figure exercise diagrams, hand-drawn as SVG paths.
 * Color inherits from `currentColor` — set a text color on the parent.
 */
const POSES: Record<string, ReactNode> = {
  /* -------- floor & bodyweight -------- */
  pushup: (
    <>
      <circle cx="98" cy="52" r="10" />
      <path d="M84 60 38 72" />
      <path d="M84 60 80 96" />
      <path d="M38 72 18 94" />
    </>
  ),
  plank: (
    <>
      <circle cx="96" cy="60" r="10" />
      <path d="M82 68 38 76" />
      <path d="M82 68 76 96M76 96 94 94" />
      <path d="M38 76 18 94" />
    </>
  ),
  squat: (
    <>
      <circle cx="56" cy="16" r="10" />
      <path d="M56 28 62 62" />
      <path d="M62 62 80 72M80 72 80 94" />
      <path d="M56 34 88 48" />
    </>
  ),
  lunge: (
    <>
      <circle cx="58" cy="14" r="10" />
      <path d="M58 26 54 56" />
      <path d="M54 56 76 68M76 68 76 94" />
      <path d="M54 56 36 74M36 74 40 92" />
      <path d="M58 30 74 50" />
    </>
  ),
  jumpingjack: (
    <>
      <circle cx="60" cy="14" r="10" />
      <path d="M60 26 60 60" />
      <path d="M60 60 40 94M60 60 80 94" />
      <path d="M60 32 36 14M60 32 84 14" />
    </>
  ),
  burpee: (
    <>
      <circle cx="82" cy="52" r="10" />
      <path d="M74 60 58 74" />
      <path d="M74 60 56 96" />
      <path d="M58 74 76 84M76 84 80 95" />
    </>
  ),
  climber: (
    <>
      <circle cx="98" cy="50" r="10" />
      <path d="M84 58 40 70" />
      <path d="M84 58 80 96" />
      <path d="M40 70 20 94" />
      <path d="M40 70 66 80M66 80 60 94" />
    </>
  ),
  wallsit: (
    <>
      <path d="M24 16 24 96" strokeWidth="4" opacity="0.35" />
      <circle cx="34" cy="14" r="10" />
      <path d="M36 26 38 58" />
      <path d="M38 58 62 62M62 62 62 94" />
      <path d="M37 32 54 58" />
    </>
  ),
  bridge: (
    <>
      <circle cx="24" cy="72" r="9" />
      <path d="M32 76 64 50" />
      <path d="M64 50 80 58M80 58 78 90" />
      <path d="M38 78 58 86" />
    </>
  ),
  deadbug: (
    <>
      <circle cx="24" cy="70" r="9" />
      <path d="M32 74 76 78" />
      <path d="M76 78 88 56M88 56 104 64" />
      <path d="M52 76 64 50" />
    </>
  ),
  /* -------- gym -------- */
  bench: (
    <>
      <path d="M20 74 100 74M32 74 32 96M92 74 92 96" strokeWidth="5" opacity="0.45" />
      <circle cx="32" cy="62" r="9" />
      <path d="M40 66 84 68" />
      <path d="M84 68 98 80M98 80 94 94" />
      <path d="M56 66 52 40" />
      <path d="M38 36 66 36" strokeWidth="5" />
    </>
  ),
  ohp: (
    <>
      <circle cx="60" cy="20" r="10" />
      <path d="M60 32 60 62" />
      <path d="M60 62 48 94M60 62 72 94" />
      <path d="M60 36 46 16M60 36 74 16" />
      <path d="M38 12 82 12" strokeWidth="5" />
    </>
  ),
  row: (
    <>
      <circle cx="92" cy="36" r="10" />
      <path d="M84 46 52 56" />
      <path d="M52 56 44 94M52 56 62 92" />
      <path d="M78 48 72 82" />
      <path d="M58 86 88 86" strokeWidth="5" />
    </>
  ),
  pulldown: (
    <>
      <circle cx="60" cy="30" r="10" />
      <path d="M60 42 60 68" />
      <path d="M60 68 80 74M80 74 80 94" />
      <path d="M60 44 46 26M60 44 74 26" />
      <path d="M38 22 82 22" strokeWidth="5" />
    </>
  ),
  curl: (
    <>
      <circle cx="60" cy="16" r="10" />
      <path d="M60 28 60 60" />
      <path d="M60 60 48 94M60 60 72 94" />
      <path d="M60 34 46 54M46 54 58 48" />
      <path d="M60 34 74 54M74 54 62 48" />
    </>
  ),
  run: (
    <>
      <circle cx="70" cy="16" r="10" />
      <path d="M68 28 58 56" />
      <path d="M58 56 84 66M84 66 88 90" />
      <path d="M58 56 38 68M38 68 28 88" />
      <path d="M66 32 88 42M88 42 80 56" />
      <path d="M66 32 48 46M48 46 54 60" />
    </>
  ),
  stretch: (
    <>
      <circle cx="52" cy="74" r="9" />
      <path d="M82 38 28 94" />
      <path d="M82 38 98 94" />
    </>
  ),
}

export function Stickman({
  pose,
  size = 56,
  className,
}: {
  pose: string
  size?: number
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {POSES[pose] ?? POSES.jumpingjack}
    </svg>
  )
}

export const HAS_POSE = (p: string) => p in POSES
