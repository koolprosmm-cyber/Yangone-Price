-- Phase 2 Migration: Knowledge Base Versioning + Evidence Ranking
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql

-- 1. KB Versions table
CREATE TABLE IF NOT EXISTS kb_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  version integer NOT NULL UNIQUE,
  label text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Seed initial version
INSERT INTO kb_versions (version, label) VALUES (1, 'Initial knowledge base') ON CONFLICT DO NOTHING;

-- 2. Add reliability_tier to market_data
ALTER TABLE market_data ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'UnknownSource'
  CHECK (reliability_tier IN ('Government','LicensedBank','MajorDeveloper','VerifiedAgency','VerifiedAgent','FacebookListing','UnknownSource'));

-- 3. Add reliability_tier to comparables
ALTER TABLE comparables ADD COLUMN IF NOT EXISTS reliability_tier text DEFAULT 'FacebookListing'
  CHECK (reliability_tier IN ('Government','LicensedBank','MajorDeveloper','VerifiedAgency','VerifiedAgent','FacebookListing','UnknownSource'));

-- 4. Add kb_version + ai_model to analyses
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS kb_version integer;
ALTER TABLE analyses ADD COLUMN IF NOT EXISTS ai_model text;

-- 5. Indexes for faster evidence retrieval
CREATE INDEX IF NOT EXISTS idx_market_data_township ON market_data(township);
CREATE INDEX IF NOT EXISTS idx_comparables_township ON comparables(township);
CREATE INDEX IF NOT EXISTS idx_market_data_reliability ON market_data(reliability_tier);
