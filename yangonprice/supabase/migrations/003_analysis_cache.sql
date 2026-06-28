-- Add analysis cache columns to market_data
ALTER TABLE market_data
  ADD COLUMN IF NOT EXISTS analysis_json jsonb,
  ADD COLUMN IF NOT EXISTS executive_summary_mm text,
  ADD COLUMN IF NOT EXISTS analysis_decision text,
  ADD COLUMN IF NOT EXISTS analysis_generated_at timestamptz;
