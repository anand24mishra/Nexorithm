#!/usr/bin/env bash
# S3 answers a missing app route with AccessDenied XML. CloudFront must
# return index.html so the client router can render /login and the other routes.
set -euo pipefail

if [[ -z "${DISTRIBUTION_ID:-}" ]]; then
  echo "CLOUDFRONT_DISTRIBUTION_ID is not set" >&2
  exit 1
fi

aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > /tmp/cf.json
etag=$(jq -r '.ETag' /tmp/cf.json)
jq '
  .DistributionConfig
  | .CustomErrorResponses = (.CustomErrorResponses // {Quantity: 0, Items: []})
  | .CustomErrorResponses.Items = (
      ((.CustomErrorResponses.Items // []) | map(select(.ErrorCode != 403 and .ErrorCode != 404)))
      + [
          {ErrorCode: 403, ResponsePagePath: "/index.html", ResponseCode: "200", ErrorCachingMinTTL: 0},
          {ErrorCode: 404, ResponsePagePath: "/index.html", ResponseCode: "200", ErrorCachingMinTTL: 0}
        ]
    )
  | .CustomErrorResponses.Quantity = (.CustomErrorResponses.Items | length)
' /tmp/cf.json > /tmp/cf-config.json

aws cloudfront update-distribution \
  --id "$DISTRIBUTION_ID" \
  --if-match "$etag" \
  --distribution-config file:///tmp/cf-config.json \
  --query 'Distribution.{Id:Id,Status:Status}' \
  --output json
