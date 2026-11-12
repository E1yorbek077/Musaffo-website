// Spec icons modelled on the catalog's row: percent, bottle, stacked box, thermometer + clock.
const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  className: "size-6",
  "aria-hidden": true,
} as const;

export function PercentIcon() {
  return (
    <svg {...base}>
      <path d="M19 5L5 19" />
      <circle cx="7" cy="7" r="2.5" />
      <circle cx="17" cy="17" r="2.5" />
    </svg>
  );
}

export function BottleIcon() {
  return (
    <svg {...base}>
      <path d="M10 2.5h4v3h-4z" />
      <path d="M10 5.5c0 2-3 3-3 6v8a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-8c0-3-3-4-3-6" />
    </svg>
  );
}

export function BoxIcon() {
  return (
    <svg {...base}>
      <path d="M12 3l8.5 4.5L12 12 3.5 7.5z" />
      <path d="M3.5 12L12 16.5 20.5 12" />
      <path d="M3.5 16.5L12 21l8.5-4.5" />
    </svg>
  );
}

export function ThermoClockIcon() {
  return (
    <svg {...base}>
      <path d="M8 13.5V5a2 2 0 1 0-4 0v8.5a3.5 3.5 0 1 0 4 0z" />
      <circle cx="16.5" cy="14" r="5.5" />
      <path d="M16.5 11v3l2 1.5" />
    </svg>
  );
}
