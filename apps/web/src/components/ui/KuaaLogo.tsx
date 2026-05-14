import AsaGlyph from './AsaGlyph'

interface Props {
  size?: number
  dark?: boolean
  showTagline?: boolean
}

export default function KuaaLogo({ size = 44, dark = false, showTagline = false }: Props) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: size * 0.32,
          background: '#FFDC5C',
          display: 'grid',
          placeItems: 'center',
          boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,.05)',
          flexShrink: 0,
        }}
      >
        <AsaGlyph size={size * 0.62} />
      </div>
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
