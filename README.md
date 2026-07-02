# YangonPrice

Yangon real estate property analysis app. Users paste a property listing (in Burmese or English) and receive a BUY / WAIT / AVOID recommendation with price comparison, risk assessment, and a full analysis — all in Burmese.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key (GPT-4o) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key |
| `CLERK_SECRET_KEY` | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | `/` |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | `/` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) |
| `REQUIRE_AUTH_FOR_ANALYSIS` | `false` (set to `true` to gate analysis behind login) |

### 3. Database

Run the migration in Supabase SQL editor:

```sql
-- File: supabase/migrations/001_init.sql
```

Or paste the contents of `supabase/migrations/001_init.sql` directly into the Supabase SQL editor.

### 4. Run

```bash
npm run dev
```

---

## Database schema

### `comparables`

Admin-uploaded market listings used for price benchmarking.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `township` | text | e.g. မရမ်းကုန်း |
| `property_type` | text | e.g. apartment, house, land |
| `price_total_lakhs` | numeric | Total asking price in lakhs |
| `area_sqft` | numeric | Land/floor area in sqft |
| `price_per_sqft_lakhs` | numeric | Computed: price_total / area |
| `notes` | text | Optional |
| `uploaded_by` | text | Clerk user ID |
| `created_at` | timestamptz | |

### `analyses`

Log of every analysis run.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `raw_input` | text | User's pasted listing |
| `decision` | text | BUY / WAIT / AVOID |
| `method_note` | text | |
| `property_summary` | text | Burmese prose paragraph |
| `price_analysis` | jsonb | Price comparison data |
| `considerations` | text | Burmese prose paragraph |
| `comparison` | jsonb | Comparable stats |
| `risk_assessment` | jsonb | Array of risk strings |
| `recommendation` | text | |
| `confidence` | int | 0–100 |
| `extracted_data` | jsonb | Extracted location, type, price, area |
| `created_at` | timestamptz | |

---

## Admin access

To grant a user admin access (required for `/admin` comparables upload):

1. Go to Clerk Dashboard → Users
2. Find the user → Edit public metadata
3. Set: `{ "role": "admin" }`

---

## Auth

- Main analysis form: **public** (no login required for demo)
- Admin upload (`/admin`): **requires Clerk login + admin role**
- To require login for analysis: set `REQUIRE_AUTH_FOR_ANALYSIS=true` in `.env.local`

---

## API

### `POST /api/analyze`

**Body:**
```json
{ "listing": "...pasted property listing text..." }
```

**Response:**
```json
{
  "method_note": "...",
  "extracted_data": { "location": "", "property_type": "", "price_stated": "", "area_stated": "", "missing_fields_note": "" },
  "decision": "BUY | WAIT | AVOID",
  "property_summary": "...",
  "price_analysis": { "user_price_total": "", "user_price_per_sqft": "", "market_average_per_sqft": "", "position": "BELOW | AVERAGE | ABOVE | UNKNOWN", "explanation": "" },
  "considerations": "...",
  "comparison": { "similar_properties_found": 0, "township_average_per_sqft": "", "notes": "" },
  "risk_assessment": ["..."],
  "recommendation": "...",
  "confidence": 0
}
```

The `_internal_actor_analysis` field from the OpenAI response is stripped server-side and never sent to the browser.

### `POST /api/admin/upload`

Requires Clerk session with `role: "admin"` in public metadata.

**Body:**
```json
{
  "township": "မရမ်းကုန်း",
  "property_type": "house",
  "price_total_lakhs": 82000,
  "area_sqft": 6091,
  "notes": "optional"
}
```
