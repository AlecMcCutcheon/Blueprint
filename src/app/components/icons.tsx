// Inline SVG icon set — stroke style, currentColor, sized via CSS.
// No emoji anywhere; these sit flush with the serif/paper aesthetic.

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

export type IconName =
  | 'sun' | 'moon'
  | 'compass' | 'chat' | 'shield' | 'loop' | 'umbrella' | 'heart' | 'home'
  | 'tension' | 'sparkle' | 'feather'
  | 'copy' | 'check' | 'import' | 'close'
  | 'volume' | 'stop' | 'door' | 'code' | 'download';

const PATHS: Record<IconName, React.ReactNode> = {
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: (
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  ),
  code: (
    <path d="m8 6-6 6 6 6M16 6l6 6-6 6" />
  ),
  download: (
    <path d="M12 3v11M7 9l5 5 5-5M4 20h16" />
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="m15.5 8.5-2 5-5 2 2-5z" />
    </>
  ),
  chat: (
    <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8z" />
  ),
  shield: (
    <path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6z" />
  ),
  loop: (
    <>
      <path d="M3 12a9 9 0 0 1 15.5-6.2L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-15.5 6.2L3 16" />
      <path d="M3 21v-5h5" />
    </>
  ),
  umbrella: (
    <>
      <path d="M12 3a9 9 0 0 1 9 9H3a9 9 0 0 1 9-9z" />
      <path d="M12 12v6a2 2 0 0 0 4 0" />
    </>
  ),
  heart: (
    <path d="M12 20s-7-4.6-9-9c-1.2-2.7.6-6 3.8-6 2 0 3.4 1.2 5.2 3.4C13.8 6.2 15.2 5 17.2 5c3.2 0 5 3.3 3.8 6-2 4.4-9 9-9 9z" />
  ),
  home: (
    <>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10h14V10" />
      <path d="M10 20v-6h4v6" />
    </>
  ),
  tension: (
    <>
      <path d="M8 3v4M8 11v10M16 3v10M16 17v4" />
      <circle cx="8" cy="9" r="2" />
      <circle cx="16" cy="15" r="2" />
    </>
  ),
  sparkle: (
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9z" />
  ),
  feather: (
    <>
      <path d="M20.2 3.8a5.5 5.5 0 0 0-7.8 0L3 13.2V21h7.8l9.4-9.4a5.5 5.5 0 0 0 0-7.8z" />
      <path d="M16 8L3 21" />
    </>
  ),
  copy: (
    <>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15H4a2 2  0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </>
  ),
  check: (
    <path d="M20 6L9 17l-5-5" />
  ),
  import: (
    <>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </>
  ),
  close: (
    <path d="M18 6L6 18M6 6l12 12" />
  ),
  volume: (
    <>
      <path d="M11 5L6 9H3v6h3l5 4z" />
      <path d="M15.5 8.5a5 5 0 0 1 0 7" />
      <path d="M18.2 6a8.5 8.5 0 0 1 0 12" />
    </>
  ),
  stop: (
    <rect x="6" y="6" width="12" height="12" rx="2" />
  ),
  door: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M7 21V7.5L14 3" />
      <circle cx="15.4" cy="12.6" r="0.4" />
    </>
  ),
};

export default function Icon({ name, size = 18, className }: IconProps) {
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
