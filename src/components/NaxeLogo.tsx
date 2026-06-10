interface NaxeLogoProps {
  /** Pixel size of the square icon. */
  size?: number;
  /** Show the "NAXE OS" wordmark next to the icon. */
  withWordmark?: boolean;
  /** Wordmark text color (defaults to white for dark sidebar). */
  wordmarkClassName?: string;
  className?: string;
}

/**
 * NAXE OS brand mark: a rounded-square blue-gradient icon with a white "N"
 * crossed by a cyan diagonal. Used in the sidebar, login screen and print
 * headers so branding stays consistent everywhere.
 */
export default function NaxeLogo({
  size = 36,
  withWordmark = false,
  wordmarkClassName = "text-white",
  className = "",
}: NaxeLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-label="NAXE OS"
      >
        <defs>
          <linearGradient id="naxeBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4f7cf7" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>
          <linearGradient id="naxeDiag" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
        {/* Rounded-square background */}
        <rect x="2" y="2" width="96" height="96" rx="26" fill="url(#naxeBg)" />
        {/* N — diagonal (cyan) drawn first, behind the vertical bars */}
        <polygon points="35,28 46,28 67,72 56,72" fill="url(#naxeDiag)" />
        {/* N — left & right vertical bars (white) */}
        <rect x="33" y="28" width="12" height="44" rx="3" fill="#ffffff" />
        <rect x="57" y="28" width="12" height="44" rx="3" fill="#ffffff" />
      </svg>
      {withWordmark && (
        <span className={`text-xl font-black tracking-tight ${wordmarkClassName}`}>
          NAXE<span className="text-sky-400"> OS</span>
        </span>
      )}
    </div>
  );
}
