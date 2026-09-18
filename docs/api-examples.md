# TruSource LIMS API - Quick Examples

## Authentication

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@trusource.com", "password": "Password123!"}'

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": { "id": "...", "email": "...", "role": "super_admin" }
}

# Get current user
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

## Samples

```bash
# List samples
curl "http://localhost:3000/api/v1/samples?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"

# Create a batch
curl -X POST http://localhost:3000/api/v1/samples/batches \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batchNumber": "BATCH-2024-001",
    "customerId": "customer-uuid",
    "samples": [
      {
        "productId": "product-uuid",
        "lotNumber": "LOT-001",
        "testMethodIds": ["method-uuid-1", "method-uuid-2"]
      }
    ]
  }'

# Get analyst queue
curl http://localhost:3000/api/v1/samples/my-queue \
  -H "Authorization: Bearer $TOKEN"

# Update sample status
curl -X POST http://localhost:3000/api/v1/samples/SAMPLE_ID/status \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "received", "justification": "Sample arrived at lab"}'
```

## Testing

```bash
# Get pending tests
curl http://localhost:3000/api/v1/testing/pending \
  -H "Authorization: Bearer $TOKEN"

# Start a test
curl -X POST http://localhost:3000/api/v1/testing/TEST_ID/start \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"instrumentId": "instrument-uuid"}'

# Enter results
curl -X POST http://localhost:3000/api/v1/testing/TEST_ID/results \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "results": [
      {"analyte": "Purity", "resultValue": 98.5, "unit": "%", "status": "pass"}
    ]
  }'
```

## QA Review

```bash
# Get pending reviews
curl http://localhost:3000/api/v1/quality/pending-reviews \
  -H "Authorization: Bearer $TOKEN"

# Submit review with e-signature
curl -X POST http://localhost:3000/api/v1/quality/reviews/SAMPLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reviewType": "qa_review",
    "decision": "approved",
    "comments": "All specs met",
    "signatureMeaning": "I approve this record",
    "stepUpMethod": "mfa"
  }'
```

## COA Generation

```bash
# Generate COA
curl -X POST http://localhost:3000/api/v1/coa/generate/SAMPLE_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"templateId": "template-uuid", "notes": "Released for distribution"}'
```

## Public Verification (No Auth)

```bash
# Search
curl "http://localhost:3000/api/v1/verify/search?q=CBD+Oil"

# Verify by COA ID
curl http://localhost:3000/api/v1/verify/coa/COA_UUID

# Verify by lot number
curl http://localhost:3000/api/v1/verify/lot/LOT-2024-001

# Verify badge by code
curl http://localhost:3000/api/v1/badges/code/BADGE_CODE
```

## Audit

```bash
# Query audit trail (admin only)
curl "http://localhost:3000/api/v1/audit?page=1&limit=50&action=CREATE" \
  -H "Authorization: Bearer $TOKEN"

# Verify hash chain
curl http://localhost:3000/api/v1/audit/verify-chain \
  -H "Authorization: Bearer $TOKEN"
```

## API Keys

```bash
# Create API key (manufacturer only)
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production Integration",
    "scopes": ["read:samples", "write:samples"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'

# Use API key
curl http://localhost:3000/api/v1/samples \
  -H "X-API-Key: tsk_abc123..."
```