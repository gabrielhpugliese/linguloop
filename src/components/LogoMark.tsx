/**
 * The LinguLoop mark: an infinity loop (blue into purple) with a play button in the right loop.
 * Decorative: always rendered next to the visible "LinguLoop" name, so it is hidden from
 * screen readers. Same artwork as src/app/icon.svg (which adds the dark tile).
 */
export default function LogoMark({ height = 24 }: { height?: number }) {
  return (
    <svg
      viewBox="0 0 56 32"
      height={height}
      width={(height * 56) / 32}
      fill="none"
      strokeWidth={4.5}
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
      style={{ display: 'block', flexShrink: 0 }}
    >
      {/* Gap where the lower-left → upper-right strand passes over the other one. Every
          instance draws the same mask, so a repeated id on one page is harmless. */}
      <mask id="linguloop-mark-gap" maskUnits="userSpaceOnUse" x="0" y="0" width="56" height="32">
        <rect width="56" height="32" fill="#fff" />
        <path d="M15 26C21 26 25 19.5 28 16C31 12.5 35 6 41 6" stroke="#000" strokeWidth={8} />
      </mask>
      <g mask="url(#linguloop-mark-gap)">
        <path d="M28 16C25 12.5 21 6 15 6" stroke="#90caf9" />
        <path d="M41 26C35 26 31 19.5 28 16" stroke="#ce93d8" />
      </g>
      <path d="M15 6C9 6 4.5 10.5 4.5 16C4.5 21.5 9 26 15 26C21 26 25 19.5 28 16" stroke="#90caf9" strokeLinecap="butt" />
      <path d="M28 16C31 12.5 35 6 41 6C47 6 51.5 10.5 51.5 16C51.5 21.5 47 26 41 26" stroke="#ce93d8" strokeLinecap="butt" />
      <path d="M38.8 12.4L45.2 16L38.8 19.6Z" fill="#ce93d8" stroke="#ce93d8" strokeWidth={1.6} strokeLinejoin="round" />
    </svg>
  );
}
