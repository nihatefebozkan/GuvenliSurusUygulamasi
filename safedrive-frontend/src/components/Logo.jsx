// SafeDrive marka logosu — direksiyon + kalkan motifli, monoline SVG.
export default function Logo({ size = 28, withText = true }) {
  return (
    <span className="brand">
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Kalkan dış hat */}
        <path
          d="M16 2.5l10.5 3.8v8.2c0 6.6-4.4 12.2-10.5 14.5C9.9 26.7 5.5 21.1 5.5 14.5V6.3L16 2.5z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          className="brand-shield"
        />
        {/* Direksiyon dış halka */}
        <circle cx="16" cy="15" r="5.6" stroke="currentColor" strokeWidth="1.8" />
        {/* Direksiyon göbeği */}
        <circle cx="16" cy="15" r="1.7" fill="currentColor" />
        {/* Direksiyon kolları */}
        <path
          d="M16 16.7v3.9M14.5 14.1l-3.4-1.9M17.5 14.1l3.4-1.9"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
      {withText && (
        <span className="brand-text">
          Safe<span className="brand-accent">Drive</span>
        </span>
      )}
    </span>
  );
}
