type Decision = 'BUY' | 'WAIT' | 'AVOID' | 'COMPETITIVE' | 'OVERPRICED' | 'UNDERPRICED'
type Potential = 'Strong Potential' | 'Moderate Potential' | 'Limited Potential'

interface Props {
  decision?: Decision
  potential?: Potential
}

const decisionStyles: Record<Decision, React.CSSProperties> = {
  BUY:         { background: 'var(--good-soft)', color: 'var(--good)',  border: '1px solid var(--good)' },
  WAIT:        { background: 'var(--gold-soft)', color: 'var(--gold)',  border: '1px solid var(--gold)' },
  AVOID:       { background: 'var(--bad-soft)',  color: 'var(--bad)',   border: '1px solid var(--bad)'  },
  COMPETITIVE: { background: 'var(--good-soft)', color: 'var(--good)',  border: '1px solid var(--good)' },
  OVERPRICED:  { background: 'var(--bad-soft)',  color: 'var(--bad)',   border: '1px solid var(--bad)'  },
  UNDERPRICED: { background: 'var(--gold-soft)', color: 'var(--gold)',  border: '1px solid var(--gold)' },
}

const decisionLabel: Record<Decision, string> = {
  BUY:         'BUY',
  WAIT:        'WAIT',
  AVOID:       'AVOID',
  COMPETITIVE: 'COMPETITIVE PRICE',
  OVERPRICED:  'OVERPRICED',
  UNDERPRICED: 'UNDERPRICED',
}

const potentialStyles: Record<Potential, React.CSSProperties> = {
  'Strong Potential':   { background: 'var(--good-soft)', color: 'var(--good)', border: '1px solid var(--good)' },
  'Moderate Potential': { background: 'var(--gold-soft)', color: 'var(--gold)', border: '1px solid var(--gold)' },
  'Limited Potential':  { background: 'var(--bad-soft)',  color: 'var(--bad)',  border: '1px solid var(--bad)'  },
}

const base: React.CSSProperties = {
  display: 'inline-block',
  fontWeight: 800,
  fontSize: '0.95rem',
  padding: '8px 20px',
  borderRadius: 30,
  letterSpacing: '0.03em',
}

export default function DecisionPill({ decision, potential }: Props) {
  if (decision && decisionStyles[decision]) {
    return <span style={{ ...base, ...decisionStyles[decision] }}>{decisionLabel[decision]}</span>
  }
  if (potential) {
    return <span style={{ ...base, ...potentialStyles[potential] }}>{potential}</span>
  }
  return null
}
