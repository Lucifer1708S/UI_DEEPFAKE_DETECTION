# TrustGuard AI - API Documentation

## Overview

TrustGuard AI provides REST API endpoints for integrating deepfake detection capabilities into your applications. The API supports image, video, and audio analysis with real-time results and forensic-grade evidence trails.

## Authentication

All API requests require an API key. Include your API key in the `X-API-Key` header:

```
X-API-Key: your-api-key-here
```

### Generating an API Key

API keys can be generated through the web interface in your account settings. Each key has:
- Custom name for identification
- Configurable permissions
- Rate limiting
- Expiration settings

## Base URL

```
https://your-project.supabase.co/functions/v1/api-analyze
```

## Endpoints

### 1. Submit Media for Analysis

**Endpoint:** `POST /analyze`

Submit a media file (image, video, or audio) for deepfake detection analysis.

**Request:**

```bash
curl -X POST https://your-project.supabase.co/functions/v1/api-analyze/analyze \
  -H "X-API-Key: your-api-key" \
  -F "file=@/path/to/media.mp4" \
  -F "analysis_type=full"
```

**Parameters:**

- `file` (required): Media file to analyze
  - Supported formats: JPG, PNG, MP4, MOV, MP3, WAV
  - Maximum size: 100MB
- `analysis_type` (optional): Type of analysis to perform
  - `full` (default): Complete multi-modal analysis
  - `visual_only`: Image and video analysis only
  - `audio_only`: Voice and sound analysis only
  - `metadata_only`: Forensic metadata check only

**Response (202 Accepted):**

```json
{
  "success": true,
  "analysis_id": "uuid",
  "media_file_id": "uuid",
  "status": "pending",
  "message": "Analysis started. Use GET /api-analyze/status/{analysis_id} to check progress."
}
```

### 2. Check Analysis Status

**Endpoint:** `GET /status/{analysis_id}`

Retrieve the status and results of a submitted analysis.

**Request:**

```bash
curl -X GET https://your-project.supabase.co/functions/v1/api-analyze/status/{analysis_id} \
  -H "X-API-Key: your-api-key"
```

**Response (200 OK):**

```json
{
  "analysis_id": "uuid",
  "status": "completed",
  "media_file": {
    "id": "uuid",
    "file_name": "video.mp4",
    "file_type": "video"
  },
  "result": {
    "trust_score": 85.3,
    "is_authentic": true,
    "is_manipulated": false,
    "confidence_score": 85.3,
    "manipulation_types": [],
    "processing_time_ms": 3245,
    "indicators": [
      {
        "id": "uuid",
        "indicator_type": "visual_artifact",
        "category": "compression",
        "severity": "low",
        "confidence": 45.2,
        "description": "Minor compression artifacts present",
        "location_data": {},
        "evidence_data": {}
      }
    ],
    "certificate": {
      "id": "uuid",
      "certificate_hash": "abc123...",
      "blockchain_txid": "0x...",
      "blockchain_network": "ethereum-sepolia",
      "certificate_type": "verified_authentic"
    }
  },
  "created_at": "2024-01-01T12:00:00Z",
  "completed_at": "2024-01-01T12:00:05Z"
}
```

**Status Values:**
- `pending`: Analysis queued
- `processing`: Analysis in progress
- `completed`: Analysis finished successfully
- `failed`: Analysis encountered an error

### 3. List All Analyses

**Endpoint:** `GET /analyses`

Retrieve a paginated list of all analyses for your account.

**Request:**

```bash
curl -X GET "https://your-project.supabase.co/functions/v1/api-analyze/analyses?limit=50&offset=0" \
  -H "X-API-Key: your-api-key"
```

**Query Parameters:**

- `limit` (optional, default: 50): Number of results to return
- `offset` (optional, default: 0): Number of results to skip

**Response (200 OK):**

```json
{
  "analyses": [
    {
      "analysis_id": "uuid",
      "status": "completed",
      "file_name": "image.jpg",
      "is_authentic": true,
      "confidence_score": 92.1,
      "created_at": "2024-01-01T12:00:00Z",
      "completed_at": "2024-01-01T12:00:03Z"
    }
  ],
  "limit": 50,
  "offset": 0,
  "count": 1
}
```

## Response Fields

### Trust Score

The `trust_score` (0-100) represents the overall authenticity confidence:

- **85-100%**: Highly Trusted - Strong evidence of authenticity
- **70-84%**: Trusted - Likely authentic with minor concerns
- **50-69%**: Uncertain - Mixed signals requiring manual review
- **30-49%**: Suspicious - Likely manipulated
- **0-29%**: Highly Suspicious - Strong evidence of manipulation

### Indicator Types

Detection indicators are categorized by type:

- `visual_artifact`: Visual inconsistencies in images/videos
- `audio_inconsistency`: Audio manipulation markers
- `temporal_anomaly`: Timing and motion irregularities
- `metadata_mismatch`: EXIF and metadata discrepancies

### Severity Levels

- `critical`: High-confidence manipulation detected
- `high`: Significant evidence of manipulation
- `medium`: Moderate concerns requiring investigation
- `low`: Minor artifacts, possibly benign

### Manipulation Types

Detected manipulation techniques include:

- `face_swap`: Face replacement or swapping
- `voice_clone`: Synthetic voice generation
- `synthetic_generation`: AI-generated content
- `partial_edit`: Selective content modification
- `reencoding`: Multiple compression cycles

## Rate Limits

Rate limits are configurable per API key. Default limits:

- 1,000 requests per day
- 100 requests per hour
- Maximum file size: 100MB

Exceeding rate limits returns HTTP 429 (Too Many Requests).

## Error Responses

All errors return appropriate HTTP status codes with JSON error messages:

```json
{
  "error": "Error description here"
}
```

**Common Error Codes:**

- `400 Bad Request`: Invalid parameters or file format
- `401 Unauthorized`: Missing or invalid API key
- `404 Not Found`: Analysis ID not found
- `413 Payload Too Large`: File exceeds 100MB limit
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server processing error

## Integration Examples

### Python

```python
import requests

api_key = "your-api-key"
base_url = "https://your-project.supabase.co/functions/v1/api-analyze"

# Submit analysis
with open("video.mp4", "rb") as f:
    response = requests.post(
        f"{base_url}/analyze",
        headers={"X-API-Key": api_key},
        files={"file": f},
        data={"analysis_type": "full"}
    )
    analysis_id = response.json()["analysis_id"]

# Check status
import time
while True:
    response = requests.get(
        f"{base_url}/status/{analysis_id}",
        headers={"X-API-Key": api_key}
    )
    result = response.json()

    if result["status"] == "completed":
        print(f"Trust Score: {result['result']['trust_score']}%")
        print(f"Authentic: {result['result']['is_authentic']}")
        break

    time.sleep(2)
```

### JavaScript/Node.js

```javascript
const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

const apiKey = 'your-api-key';
const baseUrl = 'https://your-project.supabase.co/functions/v1/api-analyze';

// Submit analysis
const formData = new FormData();
formData.append('file', fs.createReadStream('video.mp4'));
formData.append('analysis_type', 'full');

const response = await fetch(`${baseUrl}/analyze`, {
  method: 'POST',
  headers: {
    'X-API-Key': apiKey,
  },
  body: formData,
});

const { analysis_id } = await response.json();

// Check status
const checkStatus = async () => {
  const response = await fetch(`${baseUrl}/status/${analysis_id}`, {
    headers: { 'X-API-Key': apiKey },
  });

  const result = await response.json();

  if (result.status === 'completed') {
    console.log('Trust Score:', result.result.trust_score);
    console.log('Authentic:', result.result.is_authentic);
    return result;
  }

  setTimeout(checkStatus, 2000);
};

checkStatus();
```

### cURL

```bash
# Submit analysis
ANALYSIS_ID=$(curl -X POST https://your-project.supabase.co/functions/v1/api-analyze/analyze \
  -H "X-API-Key: your-api-key" \
  -F "file=@video.mp4" \
  -F "analysis_type=full" \
  | jq -r '.analysis_id')

# Wait and check status
sleep 5

curl -X GET https://your-project.supabase.co/functions/v1/api-analyze/status/$ANALYSIS_ID \
  -H "X-API-Key: your-api-key" \
  | jq '.result.trust_score'
```

## Best Practices

1. **Polling**: When checking analysis status, use exponential backoff starting at 2 seconds
2. **Error Handling**: Always implement retry logic for transient errors (5xx codes)
3. **File Validation**: Pre-validate file size and format before uploading
4. **Result Caching**: Cache completed analysis results to avoid redundant API calls
5. **Webhooks**: Contact support to enable webhook notifications for completed analyses
6. **Security**: Never expose API keys in client-side code

## Support

For technical support, integration assistance, or to report issues:
- Email: support@trustguard.ai
- Documentation: https://docs.trustguard.ai
- Status Page: https://status.trustguard.ai
