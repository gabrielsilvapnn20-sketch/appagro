// Ícones SVG — reproduzidos verbatim do protótipo sulco.html.
import type { SVGProps } from "react";

type IProps = Omit<SVGProps<SVGSVGElement>, "strokeWidth">;

function Svg({
  children,
  strokeWidth = 2,
  ...props
}: Omit<IProps, "strokeWidth"> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (p: IProps) => (
  <Svg {...p}>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v10h5v-6h4v6h5V10" />
  </Svg>
);

export const IconUsers = (p: IProps) => (
  <Svg {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.5 20c0-4 3-6.2 6.5-6.2s6.5 2.2 6.5 6.2" />
    <path d="M16 8.2a3 3 0 1 1 3 3.4" />
    <path d="M17 13.6c2.8.4 4.5 2.4 4.5 5.4" />
  </Svg>
);

export const IconVisit = (p: IProps) => (
  <Svg {...p}>
    <path d="M12 20s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11Z" />
    <circle cx="12" cy="9" r="2.3" />
  </Svg>
);

export const IconFunnel = (p: IProps) => (
  <Svg {...p}>
    <path d="M3 4h18l-7 9v6l-4 2v-8L3 4Z" />
  </Svg>
);

export const IconCalendar = (p: IProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
    <path d="M3.5 9.5h17" />
    <path d="M8 3v3.5M16 3v3.5" />
  </Svg>
);

export const IconPlus = (p: IProps) => (
  <Svg strokeWidth={2.3} {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconClock = (p: IProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v6l4 2" />
  </Svg>
);

export const IconCheckCircle = (p: IProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <path d="M9 12l2 2 4-4" />
    <circle cx="12" cy="12" r="9" />
  </Svg>
);

export const IconSearch = (p: IProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

export const IconUserEmpty = (p: IProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7" />
  </Svg>
);

export const IconChevron = (p: IProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

export const IconClose = (p: IProps) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Svg>
);

export const IconCamera = (p: IProps) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M8 5l1.5-2h5L16 5" />
  </Svg>
);

export const IconVisitEmpty = (p: IProps) => (
  <Svg strokeWidth={1.6} {...p}>
    <path d="M12 20s-7-5-7-11a7 7 0 0 1 14 0c0 6-7 11-7 11Z" />
  </Svg>
);

export const IconPinCircle = (p: IProps) => (
  <Svg {...p}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </Svg>
);

export const IconPinSmall = (p: IProps) => (
  <Svg strokeWidth={2.3} {...p}>
    <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11Z" />
  </Svg>
);
