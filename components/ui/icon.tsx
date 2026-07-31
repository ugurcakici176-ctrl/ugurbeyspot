import type { ReactNode, SVGProps } from "react";

export interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
}

function icon(name: string): ReactNode {
  switch (name) {
    case "menu": return <path d="M4 7h16M4 12h16M4 17h16" />;
    case "x": return <path d="m6 6 12 12M18 6 6 18" />;
    case "arrow-right": return <path d="M5 12h14m-5-5 5 5-5 5" />;
    case "arrow-up-right": return <path d="M7 17 17 7M8 7h9v9" />;
    case "chevron-down": return <path d="m7 10 5 5 5-5" />;
    case "search":
      return <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>;
    case "phone":
      return <path d="M7 4 5 6c0 7.18 5.82 13 13 13l2-2-4-3-1.5 1.5a12 12 0 0 1-6-6L10 8 7 4Z" />;
    case "message-circle":
      return <><path d="M21 11.5a8.5 8.5 0 0 1-9 8.5 9.8 9.8 0 0 1-4-.9L3 21l1.9-4.6A8.5 8.5 0 1 1 21 11.5Z" /><path d="M8.5 12h.01M12 12h.01M15.5 12h.01" /></>;
    case "map-pin":
      return <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>;
    case "mail":
      return <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>;
    case "clock":
      return <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>;
    case "package":
      return <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.8 7.5 4.3 7.5-4.3M12 12v9" /></>;
    case "shopping-bag":
      return <><path d="M6 7h12l1 13H5L6 7Z" /><path d="M9 7V6a3 3 0 0 1 6 0v1" /></>;
    case "badge-percent":
      return <><path d="m12 3 2 2 3-.4.9 2.9 2.7 1.4-.9 2.9 1.8 2.2-1.8 2.2.9 2.9-2.7 1.4-.9 2.9-3-.4-2 2-2-2-3 .4-.9-2.9-2.7-1.4.9-2.9L3.5 14l1.8-2.2-.9-2.9 2.7-1.4.9-2.9 3 .4 2-2Z" /><path d="m9 15 6-6M9.5 9h.01M14.5 15h.01" /></>;
    case "shield-check":
      return <><path d="M12 3 5 6v5c0 4.6 2.8 8.1 7 10 4.2-1.9 7-5.4 7-10V6l-7-3Z" /><path d="m9 12 2 2 4-4" /></>;
    case "layers":
      return <><path d="m12 3 9 5-9 5-9-5 9-5Z" /><path d="m3 12 9 5 9-5M3 16l9 5 9-5" /></>;
    case "store":
      return <><path d="M4 10v10h16V10M3 10l2-6h14l2 6" /><path d="M3 10a3 3 0 0 0 5 2 3 3 0 0 0 4 0 3 3 0 0 0 4 0 3 3 0 0 0 5-2M9 20v-5h6v5" /></>;
    case "heart-handshake":
      return <><path d="M8.5 6.5 12 10l3.5-3.5a4 4 0 0 1 5.5 5.8L12 21l-9-8.7a4 4 0 0 1 5.5-5.8Z" /><path d="m8 14 2 2 4-4" /></>;
    case "sparkles":
      return <><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" /><path d="m19 14 .7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7L19 14ZM5 14l.7 2.3L8 17l-2.3.7L5 20l-.7-2.3L2 17l2.3-.7L5 14Z" /></>;
    case "grid":
      return <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>;
    case "tag":
      return <><path d="M3 12V5a2 2 0 0 1 2-2h7l9 9-9 9-9-9Z" /><circle cx="8" cy="8" r="1" /></>;
    case "settings":
      return <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.5 6A7 7 0 0 0 9 7.1l-2.4-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.5 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" /></>;
    case "home":
      return <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>;
    case "image":
      return <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="9" r="2" /><path d="m3 17 5-5 4 4 2-2 7 6" /></>;
    case "plus": return <path d="M12 5v14M5 12h14" />;
    case "check": return <path d="m5 12 4 4 10-10" />;
    case "edit":
      return <><path d="M4 20h4l11-11-4-4L4 16v4Z" /><path d="m13.5 6.5 4 4" /></>;
    case "trash":
      return <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" /><path d="M10 11v6M14 11v6" /></>;
    case "save":
      return <><path d="M5 3h12l2 2v16H5V3Z" /><path d="M8 3v6h8V3M8 21v-7h8v7" /></>;
    case "external-link":
      return <><path d="M14 4h6v6M20 4l-9 9" /><path d="M18 13v6H5V6h6" /></>;
    case "upload":
      return <><path d="M12 16V4M7 9l5-5 5 5" /><path d="M4 16v4h16v-4" /></>;
    case "inbox":
      return <><path d="M4 5h16l2 10v4H2v-4L4 5Z" /><path d="M2 15h6l2 2h4l2-2h6" /></>;
    case "users":
      return <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>;
    case "eye":
      return <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></>;
    case "log-out":
      return <><path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5M14 8l4 4-4 4M9 12h9" /></>;
    default:
      return icon("sparkles");
  }
}

export default function Icon({
  name,
  size = 20,
  ...props
}: IconProps) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {icon(name)}
    </svg>
  );
}
