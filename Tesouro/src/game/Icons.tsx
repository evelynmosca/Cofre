import type { CSSProperties } from 'react'

const paths: Record<string, string> = {
  compass: 'M12 2v3m0 14v3M2 12h3m14 0h3M16 8l-2 6-6 2 2-6 6-2Z',
  arrow: 'M4 12h15m-6-6 6 6-6 6',
  back: 'M20 12H5m6-6-6 6 6 6',
  book: 'M12 5v16M3 3c4 0 7 0 9 2 2-2 5-2 9-2v16c-4 0-7 0-9 2-2-2-5-2-9-2V3Z',
  sound: 'm11 4-5 4H2v8h4l5 4V4Zm4 4c3 2 3 6 0 8m3-11c5 4 5 10 0 14',
  mute: 'm11 4-5 4H2v8h4l5 4V4Zm5 5 6 6m0-6-6 6',
  settings:
    'M9 3h6l1 3 3 1 2 5-2 5-3 1-1 3H9l-1-3-3-1-2-5 2-5 3-1 1-3Zm3 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  help: 'M9 8a3 3 0 1 1 5 2c-2 1-2 2-2 4m0 3v.1M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m8 0h5v-5',
  close: 'm5 5 14 14M19 5 5 19',
  check: 'm5 12 4 4L20 5',
  lock: 'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5V10Zm7 4v3',
  card: 'M5 2h14v20H5V2Zm7 5 3 5-3 5-3-5 3-5Z',
  scroll: 'M6 3h12v14a4 4 0 0 1-4 4H6m0-18a3 3 0 0 0-3 3h5m-2-3v15a3 3 0 1 0 3 3h5M10 8h5m-5 4h5',
  crystal: 'm12 2 7 8-7 12-7-12 7-8Zm-7 8h14M12 2l-2 8 2 12 2-12-2-8Z',
  mask: 'M4 3c5 3 11 3 16 0v9c0 5-4 8-8 10-4-2-8-5-8-10V3Zm3 7 3 1m4 0 3-1m-8 6c2-1 4-1 6 0M12 8v6',
  key: 'M9 3a6 6 0 1 0 0 12A6 6 0 0 0 9 3Zm4 10 8 8m-3-3 3-3m-6 0 3-3M9 7v4',
  sparkle: 'm12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5L12 2Z',
  feather: 'M4 21 17 8M6 17C0 5 17-1 21 3c3 5-2 18-15 14Zm4-4h6m-3-3V5',
  home: 'm3 11 9-8 9 8M6 9v12h12V9m-9 12v-7h6v7',
}
export function Icon({
  name,
  size = 20,
  className = '',
  style,
}: {
  name: string
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <path d={paths[name] || paths.sparkle} />
    </svg>
  )
}
export function Artifact({ index, size = 40 }: { index: number; size?: number }) {
  return <Icon name={['card', 'scroll', 'book', 'crystal', 'mask', 'key'][index]} size={size} />
}
