interface Props {
  decision: 'BUY' | 'WAIT' | 'AVOID'
}

const styles: Record<string, React.CSSProperties> = {
  BUY: {
    background: 'var(--good-soft)',
    color: 'var(--good)',
    border: '1px solid var(--good)',
  },
  WAIT: {
    background: 'var(--gold-soft)',
    color: 'var(--gold)',
    border: '1px solid var(--gold)',
  },
  AVOID: {
    background: 'var(--bad-soft)',
    color: 'var(--bad)',
    border: '1px solid var(--bad)',
  },
}

export default function DecisionPill({ decision }: Props) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontWeight: 800,
        fontSize: '1.05rem',
        padding: '10px 24px',
        borderRadius: 30,
        marginBottom: 22,
        ...styles[decision],
      }}
    >
      {decision}
    </span>
  )
}
