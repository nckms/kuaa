import KuaaMascotLogo from './KuaaMascotLogo'

interface Props {
  size?: number
  dark?: boolean
  showTagline?: boolean
  showIcon?: boolean
}

/** Wordmark "Kuaa" (degradê vinho→roxo no claro, branco no escuro). */
export default function KuaaLogo({ size = 28, dark = false, showTagline = false, showIcon = false }: Props) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      {showIcon && <KuaaMascotLogo size={Math.round(size * 1.4)} />}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <img src={dark ? '/brand/wordmark-w.png' : '/brand/wordmark-t.png'} alt="Kuaa" style={{ height: size, width: 'auto', display: 'block' }} />
        {showTagline && (
          <span style={{ fontFamily: 'var(--k-mono)', fontSize: 11, color: dark ? '#C9B4CF' : 'var(--k-muted-2)' }}>
            Conhecimento que abre asas.
          </span>
        )}
      </span>
    </span>
  )
}
