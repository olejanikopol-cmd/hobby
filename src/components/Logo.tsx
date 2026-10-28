import Link from 'next/link';

export function LogoMark({ size = 30, color = '#2F6B4F' }: { size?: number; color?: string }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 28 28">
      <path d="M14 2C8.5 2 4.5 6.2 4.5 11.4c0 6.6 7.6 13.2 8.9 14.3.4.3.9.3 1.2 0 1.3-1.1 8.9-7.7 8.9-14.3C23.5 6.2 19.5 2 14 2z" fill={color} />
      <circle cx="14" cy="11.5" r="4" fill="#FFFFFF" />
    </svg>
  );
}

export function Logo() {
  return (
    <Link href="/" aria-label="hobbyl — на головну" className="flex items-center gap-2 text-ink">
      <LogoMark />
      <span className="font-logo text-[23px] leading-none font-extrabold tracking-[-0.04em]">hobbyl</span>
    </Link>
  );
}
