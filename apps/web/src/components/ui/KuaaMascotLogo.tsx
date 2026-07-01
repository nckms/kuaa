import { useId } from 'react'

interface Props {
  size?: number
  className?: string
}

export default function KuaaMascotLogo({ size = 48, className }: Props) {
  const id = useId().replace(/:/g, '')
  const featherId = `${id}-feather`
  const hatId = `${id}-hat`
  const goldId = `${id}-gold`
  const beakId = `${id}-beak`
  const glowId = `${id}-glow`

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 256 256"
      role="img"
      aria-label="Logo Kuaa"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id={featherId} x1="76" y1="64" x2="184" y2="238" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7a0b62" />
          <stop offset="0.5" stopColor="#5a104f" />
          <stop offset="1" stopColor="#25091f" />
        </linearGradient>
        <linearGradient id={hatId} x1="76" y1="19" x2="181" y2="75" gradientUnits="userSpaceOnUse">
          <stop stopColor="#7b0f67" />
          <stop offset="1" stopColor="#4b083e" />
        </linearGradient>
        <linearGradient id={goldId} x1="60" y1="74" x2="198" y2="136" gradientUnits="userSpaceOnUse">
          <stop stopColor="#f7c74e" />
          <stop offset="1" stopColor="#c88a21" />
        </linearGradient>
        <linearGradient id={beakId} x1="103" y1="123" x2="151" y2="188" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset="0.64" stopColor="#d9d2df" />
          <stop offset="1" stopColor="#8a7890" />
        </linearGradient>
        <radialGradient id={glowId} cx="0" cy="0" r="1" gradientTransform="matrix(94 82 -82 94 124 114)" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8f1c70" />
          <stop offset="1" stopColor="#44063b" />
        </radialGradient>
      </defs>

      <path
        d="M57 89c-16 4-31 15-32 30-1 13 10 21 28 21-13 11-24 26-27 43 9-6 19-9 31-9-11 14-16 29-14 45 10-14 22-22 37-25-5 15-5 29 0 42 11-17 21-31 34-43l14 44 14-44c13 12 23 26 34 43 5-13 5-27 0-42 15 3 27 11 37 25 2-16-3-31-14-45 12 0 22 3 31 9-3-17-14-32-27-43 18 0 29-8 28-21-1-15-16-26-32-30-26-7-48-3-71 8-23-11-45-15-71-8Z"
        fill={`url(#${featherId})`}
      />
      <path
        d="M52 103c20-7 42-6 63 7-24 1-41 6-53 18-8 0-18-2-20-8-2-7 4-13 10-17Z"
        fill="#7d125e"
        opacity="0.7"
      />
      <path
        d="M204 103c-20-7-42-6-63 7 24 1 41 6 53 18 8 0 18-2 20-8 2-7-4-13-10-17Z"
        fill="#4d073d"
        opacity="0.72"
      />

      <path
        d="M71 46c9-13 35-24 57-24s48 11 57 24l-6 51H77L71 46Z"
        fill={`url(#${hatId})`}
      />
      <path d="M77 83h102l-2 15H79l-2-15Z" fill={`url(#${goldId})`} />
      <path d="M87 54c-1-8-2-16-1-20l10-4c0 5 1 16 2 28l1 17H90l-3-21Z" fill="#d986c7" opacity="0.72" />
      <path d="M105 31c2 14 3 28 3 44h-8c0-15-1-28-3-42l8-2Z" fill="#c97abe" opacity="0.86" />

      <path
        d="M42 99c16-20 44-17 77-3h18c33-14 61-17 77 3 7 9 6 20-2 27-12 10-40 8-73-6h-22c-33 14-61 16-73 6-8-7-9-18-2-27Z"
        fill={`url(#${glowId})`}
      />
      <path d="M42 109c24-6 48-6 73 6-29-1-53 2-75 9-3-5-3-10 2-15Z" fill="#8a1a69" opacity="0.55" />

      <path d="M61 122h36" stroke="#e7ae38" strokeWidth="8" strokeLinecap="round" />
      <path d="M159 122h36" stroke="#e7ae38" strokeWidth="8" strokeLinecap="round" />
      <circle cx="86" cy="119" r="28" fill="#371032" stroke={`url(#${goldId})`} strokeWidth="8" />
      <circle cx="170" cy="119" r="28" fill="#371032" stroke={`url(#${goldId})`} strokeWidth="8" />
      <path d="M114 118c9-4 19-4 28 0" stroke="#e7ae38" strokeWidth="8" strokeLinecap="round" />
      <path d="M75 103c7-8 18-10 28-5" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.92" />
      <path d="M159 103c7-8 18-10 28-5" stroke="#fff" strokeWidth="6" strokeLinecap="round" opacity="0.92" />

      <path
        d="M128 128c-8 15-22 27-41 35 16 3 28 11 41 25 13-14 25-22 41-25-19-8-33-20-41-35Z"
        fill={`url(#${beakId})`}
      />
      <path d="M128 130v57" stroke="#f6f1f6" strokeWidth="5" strokeLinecap="round" opacity="0.82" />
      <path d="M119 147c-12 6-23 11-36 13 15 3 28 10 40 22" fill="#fff" opacity="0.78" />
      <path d="M137 147c12 6 23 11 36 13-15 3-28 10-40 22" fill="#b9aaba" opacity="0.78" />
      <path d="M128 185l-14 48 14 17 14-17-14-48Z" fill="#2d071f" opacity="0.72" />
    </svg>
  )
}
