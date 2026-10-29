export default function ArrowIcon({ direction = "right" }) {
  return (
    <svg className={`direction-icon direction-icon-${direction}`} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
