interface Props {
  value: number // 0-100
  color?: 'roxo' | 'vinho' | 'amarelo' | 'neon' | 'verde'
  size?: 'sm' | 'md' | 'lg'
}

const COLOR_MAP = {
  roxo:   '#531A61',
  vinho:  '#840033',
  amarelo:'#FFDC5C',
  neon:   '#531A61',
  verde:  '#28765B',
}

const HEIGHT_MAP = { sm: 6, md: 8, lg: 10 }

export default function ProgressBar({ value, color = 'roxo', size = 'md' }: Props) {
  const height = HEIGHT_MAP[size]
  const clamp = Math.min(100, Math.max(0, value))
  return (
    <div style={{ height, backgroundColor: 'var(--k-track)', borderRadius: 999, overflow: 'hidden', width: '100%' }}>
      <div style={{
        height: '100%',
        width: `${clamp}%`,
        backgroundColor: COLOR_MAP[color],
        borderRadius: 999,
        transition: 'width 0.5s ease',
      }} />
    </div>
  )
}
