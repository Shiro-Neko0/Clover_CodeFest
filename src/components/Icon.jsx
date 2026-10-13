// Small outline icons, same set as the prototype.
const P = {
  video: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M10 9l5 3-5 3z" /></>,
  cal: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  pulse: <path d="M3 12h4l2-6 4 12 2-6h6" />,
  pill: <g transform="rotate(-45 12 12)"><rect x="2.5" y="8" width="19" height="8" rx="4" /><path d="M12 8v8" /></g>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>,
  chat: <path d="M4 5h16v11H9l-5 4z" />,
  mic: <><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
  cam: <><path d="M4 8h3l2-3h6l2 3h3v12H4z" /><circle cx="12" cy="14" r="3.5" /></>,
  send: <path d="M4 12l16-8-6 16-3-7z" />,
  check: <path d="M5 12.5l4.5 4.5L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  heart: <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />,
  play: <path d="M8 5l11 7-11 7z" />,
  bell: <path d="M6 17v-6a6 6 0 0 1 12 0v6l2 2H4zM10 21h4" />,
  sos: <><path d="M12 3l9.5 17H2.5z" /><path d="M12 10v4M12 17.2v.1" /></>,
  moon: <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />,
  food: <path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-3 5-3 8h3v10" />,
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10" />
};

export default function Icon({ name, size = 24 }) {
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {P[name]}
    </svg>
  );
}
