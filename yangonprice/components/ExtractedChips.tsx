import { ExtractedData } from '@/lib/types'

interface Props {
  data: ExtractedData
}

export default function ExtractedChips({ data }: Props) {
  const chips = [
    { label: 'တည်နေရာ', value: data.location },
    { label: 'Type', value: data.property_type, latin: true },
    { label: 'ဈေးနှုန်း', value: data.price_stated },
    { label: 'ဧရိယာ', value: data.area_stated },
  ].filter((c) => c.value && c.value !== 'N/A' && c.value !== '')

  if (chips.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 22 }}>
      {chips.map((chip) => (
        <span
          key={chip.label}
          className={chip.latin ? '' : 'my'}
          style={{
            background: 'var(--panel-raised)',
            border: '1px solid var(--line)',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: '0.78rem',
            color: 'var(--muted)',
          }}
        >
          {chip.label}:{' '}
          <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{chip.value}</strong>
        </span>
      ))}
      {data.missing_fields_note && (
        <span
          style={{
            background: 'var(--bad-soft)',
            border: '1px solid rgba(226,100,90,0.3)',
            borderRadius: 20,
            padding: '6px 14px',
            fontSize: '0.78rem',
            color: 'var(--bad)',
          }}
        >
          {data.missing_fields_note}
        </span>
      )}
    </div>
  )
}
