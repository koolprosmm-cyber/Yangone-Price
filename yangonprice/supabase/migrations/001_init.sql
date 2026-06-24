-- Comparable property listings uploaded by admins for price benchmarking
create table if not exists comparables (
  id uuid primary key default gen_random_uuid(),
  township text not null,
  property_type text not null,
  price_total_lakhs numeric not null,
  area_sqft numeric not null,
  price_per_sqft_lakhs numeric generated always as (price_total_lakhs / nullif(area_sqft, 0)) stored,
  notes text,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

-- Analysis results log
create table if not exists analyses (
  id uuid primary key default gen_random_uuid(),
  raw_input text not null,
  decision text not null check (decision in ('BUY', 'WAIT', 'AVOID')),
  method_note text,
  property_summary text,
  price_analysis jsonb,
  considerations text,
  comparison jsonb,
  risk_assessment jsonb,
  recommendation text,
  confidence integer check (confidence between 0 and 100),
  extracted_data jsonb,
  created_at timestamptz not null default now()
);
