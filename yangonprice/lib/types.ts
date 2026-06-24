export interface ExtractedData {
  location: string
  property_type: string
  price_stated: string
  area_stated: string
  missing_fields_note: string
}

export interface PriceAnalysis {
  user_price_total: string
  user_price_per_sqft: string
  market_average_per_sqft: string
  position: 'BELOW' | 'AVERAGE' | 'ABOVE' | 'UNKNOWN'
  explanation: string
}

export interface Comparison {
  similar_properties_found: number
  township_average_per_sqft: string
  notes: string
}

export interface AnalysisResponse {
  method_note: string
  extracted_data: ExtractedData
  decision: 'BUY' | 'WAIT' | 'AVOID'
  property_summary: string
  price_analysis: PriceAnalysis
  considerations: string
  comparison: Comparison
  risk_assessment: string[]
  recommendation: string
  confidence: number
}

export interface ComparableRow {
  id: string
  township: string
  property_type: string
  price_total_lakhs: number
  area_sqft: number
  price_per_sqft_lakhs: number
  notes: string | null
  uploaded_by: string
  created_at: string
}
