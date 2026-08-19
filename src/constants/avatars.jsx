function AnchorIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2.4" />
      <line x1="12" y1="7.4" x2="12" y2="21" />
      <line x1="8.5" y1="11" x2="15.5" y2="11" />
      <path d="M5 12a7 7 0 0 0 14 0" />
    </svg>
  );
}

function CompassIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9.5" />
      <polygon points="15.5,8.5 13.3,13.3 8.5,15.5 10.7,10.7" fill={color} stroke="none" />
    </svg>
  );
}

function CrownIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19h18l-1.6-8.5-3.9 3.4L12 6l-3.5 7.9-3.9-3.4L3 19z" />
      <line x1="5.5" y1="21" x2="18.5" y2="21" />
    </svg>
  );
}

function ShieldIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5l7.5 3.2v5.4c0 5-3.2 8.6-7.5 10.4-4.3-1.8-7.5-5.4-7.5-10.4V5.7L12 2.5z" />
      <line x1="12" y1="7" x2="12" y2="16.5" />
    </svg>
  );
}

function WheatIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M12 6l-4-2M12 6l4-2M12 10l-4-2M12 10l4-2M12 14l-4-2M12 14l4-2" />
    </svg>
  );
}

function MountainIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 19.5L9 7.5l3.6 6.2L15 10l6 9.5H3z" />
    </svg>
  );
}

function SailIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="3.5" x2="12" y2="17.5" />
      <path d="M12 4.5l5.5 8.5H12V4.5z" fill={color} stroke="none" />
      <path d="M3.5 17.5h17l-2 3.5h-13l-2-3.5z" />
    </svg>
  );
}

function CastleIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 21V10h2V7h2v3h2V6h4v4h2V7h2v3h2v11H4z" />
      <path d="M10.5 21v-5a1.5 1.5 0 0 1 3 0v5" />
    </svg>
  );
}

function WaveIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9c1.8-2.6 4.2-2.6 6 0s4.2 2.6 6 0 4.2-2.6 6 0" />
      <path d="M2 15.5c1.8-2.6 4.2-2.6 6 0s4.2 2.6 6 0 4.2-2.6 6 0" />
    </svg>
  );
}

function TorchIcon({ size = 22, color = "#3a2409" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.5c2.1 2.7 2.8 4.6.9 6.5-1 1-1 2 .1 3-2.9.1-4.8-1.9-4.8-4.5 0-1.9 1-3.2 1.9-5z" />
      <line x1="11.6" y1="12.3" x2="11.6" y2="21.5" />
    </svg>
  );
}

export const AVATARS = [
  { id: "anchor", label: "Sailor", Icon: AnchorIcon },
  { id: "compass", label: "Explorer", Icon: CompassIcon },
  { id: "crown", label: "Noble", Icon: CrownIcon },
  { id: "shield", label: "Knight", Icon: ShieldIcon },
  { id: "wheat", label: "Farmer", Icon: WheatIcon },
  { id: "mountain", label: "Miner", Icon: MountainIcon },
  { id: "sail", label: "Navigator", Icon: SailIcon },
  { id: "castle", label: "Lord", Icon: CastleIcon },
  { id: "wave", label: "Fisherman", Icon: WaveIcon },
  { id: "torch", label: "Pioneer", Icon: TorchIcon },
];

export function getAvatarById(id) {
  return AVATARS.find((a) => a.id === id) || AVATARS[0];
}
