import KuaaMascotLogo from './KuaaMascotLogo'

interface Props {
  size?: number
  dark?: boolean
  showTagline?: boolean
}

export default function KuaaLogo({ size = 44, dark = false, showTagline = false }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <KuaaMascotLogo size={size} />
      <div>
        <div
          style={{
            fontFamily: "'Kaushan Script', 'Segoe Script', cursive",
            fontWeight: 400,
            fontSize: size * 0.78,
            letterSpacing: 0,
            color: dark ? '#fff' : '#531A61',
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 2,
          }}
        >
          kuaa<span style={{ color: dark ? '#FFDC5C' : '#840033' }}>.</span>
        </div>
        {showTagline && (
          <div
            style={{
              fontSize: 9.5,
              letterSpacing: 0,
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
