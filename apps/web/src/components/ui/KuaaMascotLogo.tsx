interface Props {
  size?: number
  radius?: number
  className?: string
  alt?: string
}

/** Ícone quadrado da coruja (app icon), recortado para esconder a borda branca do PNG. */
export default function KuaaMascotLogo({ size = 48, radius, className, alt = '' }: Props) {
  return (
    <span className={`k-owl${className ? ` ${className}` : ''}`} style={{ width: size, height: size, borderRadius: radius ?? Math.round(size * 0.28) }}>
      <img src="/brand/owl-icon.png" alt={alt} width={size} height={size} />
    </span>
  )
}
