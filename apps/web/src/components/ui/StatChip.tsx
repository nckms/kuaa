interface Props {
  icon: string
  value: string | number
  label: string
  variant?: 'default' | 'dark'
}

export default function StatChip({ icon, value, label, variant = 'default' }: Props) {
  const isDark = variant === 'dark'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      backgroundColor: isDark ? 'rgba(255,255,255,.1)' : '#fff',
      border: isDark ? 'none' : '1px solid #e5e7eb',
      borderRadius: 999, padding: '6px 14px',
      fontSize: 13, color: isDark ? '#fff' : '#1a1a1a',
      fontFamily: 'Arial, sans-serif', whiteSpace: 'nowrap',
    }}>
      <span>{icon}</span>
      <span style={{ fontWeight: 700 }}>{value}</span>
      <span style={{ opacity: 0.6, fontSize: 12 }}>{label}</span>
    </div>
  )
}
