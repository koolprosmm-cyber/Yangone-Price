-- Market intelligence records ingested by admins
create table if not exists market_data (
  id uuid primary key default gen_random_uuid(),
  raw_content text not null,
  market_data_type text,
  property_type text,
  township text,
  location text,
  price_lakh numeric,
  land_size text,
  building_size_sqft numeric,
  bedrooms integer,
  bathrooms integer,
  floors integer,
  listing_date date,
  upload_date date not null default current_date,
  confidence_score text,
  extraction_notes text,
  uploaded_by text not null,
  created_at timestamptz not null default now()
);

-- Index for common market queries
create index if not exists market_data_township_idx on market_data (township);
create index if not exists market_data_type_idx on market_data (property_type);
create index if not exists market_data_price_idx on market_data (price_lakh);
