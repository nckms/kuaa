interface Props {
  size?: number
  className?: string
}

export default function KuaaMascotLogo({ size = 48, className }: Props) {
  return (
    <img
      className={className}
      src="/kuaa-logo.png"
      alt="Kuaa"
      width={size}
      height={size}
      style={{
        display: 'block',
        flexShrink: 0,
        objectFit: 'contain',
        width: size,
        height: size,
      }}
    />
  )
}
