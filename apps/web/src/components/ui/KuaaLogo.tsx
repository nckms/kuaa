import KuaaMascotLogo from './KuaaMascotLogo'

interface Props {
  size?: number
  dark?: boolean
  showTagline?: boolean
}

export default function KuaaLogo({ size = 44, dark = false, showTagline = false }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <KuaaMascotLogo size={size} />
      <div>
        <div
          style={{
            fontFamily: "'Unbounded', sans-serif",
            fontWeight: 700,
            fontSize: size * 0.55,
            letterSpacing: '-0.04em',
            color: dark ? '#fff' : '#2a0d33',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 2,
          }}
        >
          kuaa<span style={{ color: '#840033' }}>.</span>
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: '.28em',
              textTransform: 'uppercase',
              color: dark ? '#FFDC5C' : '#840033',
              marginTop: 2,
              fontFamily: "'Questrial', Arial, sans-serif",
            }}
          >
            conhecimento que abre asas
          </div>
        )}
      </div>
    </div>
  )
}
