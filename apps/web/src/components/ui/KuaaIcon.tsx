type IconName =
  | 'home'
  | 'book'
  | 'chart'
  | 'chat'
  | 'gear'
  | 'bell'
  | 'search'
  | 'play'
  | 'star'
  | 'bolt'
  | 'target'
  | 'clock'
  | 'calendar'
  | 'arrowRight'
  | 'arrowUp'
  | 'flame'
  | 'sparkle'
  | 'video'
  | 'list'
  | 'flag'
  | 'check'
  | 'pause'
  | 'close'
  | 'plus'
  | 'headset'

interface Props {
  name: IconName
  size?: number
  color?: string
}

function getIconContent(name: IconName): React.ReactNode {
  switch (name) {
    case 'home':
      return (
        <>
          <path d="M3 10 L10 4 L17 10 V16 H3 Z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
          <path d="M8 16 V12 H12 V16" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
        </>
      )
    case 'book':
      return (
        <path
          d="M4 4 H10 V16 H4 Z M10 4 H16 V16 H10 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
      )
    case 'chart':
      return (
        <path
          d="M3 17 H17 M6 14 V8 M10 14 V5 M14 14 V11"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
        />
      )
    case 'chat':
      return (
        <path
          d="M3 5 H17 V13 H8 L4 16 V13 H3 Z"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
      )
    case 'gear':
      return (
        <>
          <circle cx="10" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path
            d="M10 3 V5 M10 15 V17 M3 10 H5 M15 10 H17 M5 5 L6.5 6.5 M13.5 13.5 L15 15 M5 15 L6.5 13.5 M13.5 6.5 L15 5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </>
      )
    case 'bell':
      return (
        <path
          d="M5 14 H15 L13 11 V8 A3 3 0 0 0 7 8 V11 Z M8 14 V15 A2 2 0 0 0 12 15 V14"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
        />
      )
    case 'search':
      return (
        <>
          <circle cx="9" cy="9" r="5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M13 13 L17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )
    case 'play':
      return <path d="M6 4 L15 10 L6 16 Z" fill="currentColor" />
    case 'star':
      return (
        <path
          d="M10 3 L12 8 L17 8.5 L13 12 L14 17 L10 14.5 L6 17 L7 12 L3 8.5 L8 8 Z"
          fill="currentColor"
        />
      )
    case 'bolt':
      return <path d="M11 2 L4 11 H9 L8 18 L15 9 H10 Z" fill="currentColor" />
    case 'target':
      return (
        <>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <circle cx="10" cy="10" r="1" fill="currentColor" />
        </>
      )
    case 'clock':
      return (
        <>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M10 6 V10 L13 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )
    case 'calendar':
      return (
        <>
          <rect x="3" y="5" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M3 8 H17 M7 3 V6 M13 3 V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </>
      )
    case 'arrowRight':
      return (
        <path
          d="M3 10 H17 M12 5 L17 10 L12 15"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'arrowUp':
      return (
        <path
          d="M10 17 V3 M5 8 L10 3 L15 8"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'flame':
      return (
        <path
          d="M10 2 C 12 6, 14 8, 14 12 A 4 4 0 0 1 6 12 C 6 9, 8 9, 8 6 C 9 7, 10 5, 10 2 Z"
          fill="currentColor"
        />
      )
    case 'sparkle':
      return (
        <path
          d="M10 2 L11.5 8.5 L18 10 L11.5 11.5 L10 18 L8.5 11.5 L2 10 L8.5 8.5 Z"
          fill="currentColor"
        />
      )
    case 'video':
      return (
        <>
          <rect x="3" y="6" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
          <path d="M14 9 L17 7 V13 L14 11 Z" fill="currentColor" />
        </>
      )
    case 'list':
      return (
        <path
          d="M5 6 H16 M5 10 H16 M5 14 H12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )
    case 'flag':
      return (
        <path
          d="M5 3 V17 M5 4 H14 L12 8 L14 12 H5"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )
    case 'check':
      return (
        <path
          d="M4 10 L8 14 L16 6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )
    case 'pause':
      return (
        <>
          <rect x="6" y="4" width="3" height="12" fill="currentColor" rx="0.5" />
          <rect x="11" y="4" width="3" height="12" fill="currentColor" rx="0.5" />
        </>
      )
    case 'close':
      return (
        <path
          d="M5 5 L15 15 M15 5 L5 15"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )
    case 'plus':
      return (
        <path
          d="M10 4 V16 M4 10 H16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      )
    case 'headset':
      return (
        <>
          <path
            d="M4 11 V9 A 6 6 0 0 1 16 9 V11"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          />
          <rect x="3" y="11" width="3" height="5" rx="1" fill="currentColor" />
          <rect x="14" y="11" width="3" height="5" rx="1" fill="currentColor" />
        </>
      )
    default:
      return null
  }
}

export default function KuaaIcon({ name, size = 20, color = 'currentColor' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      style={{ color, flexShrink: 0 }}
      aria-hidden="true"
    >
      {getIconContent(name)}
    </svg>
  )
}
