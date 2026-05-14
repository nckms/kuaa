interface Props {
  value: number // 0-100
  color?: 'roxo' | 'vinho' | 'amarelo'
  size?: 'sm' | 'md'
}

const COLOR_MAP = { roxo: '#531A61', vinho: '#840033', amarelo: '#FFDC5C' }

export default function ProgressBar({ value, color = 'roxo', size = 'md' }: Props) {
  const height = size === 'sm' ? 4 : 8
  const clamp = Math.min(100, Math.max(0, value))
  return (
    <div style={{ height, backgroundColor: '#e5e7eb', borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div style={{ height: '100%', width: `${clamp}%`, backgroundColor: COLOR_MAP[color], borderRadius: 999, transition: 'width 0.5s ease' }} />
    </div>
  )
}
