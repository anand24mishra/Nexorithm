#!/usr/bin/env bash
# S3 has no object for client routes such as /login, so it returns AccessDenied XML.
# CloudFront should serve index.html for those misses. The deploy user may not be
# allowed to edit the distribution, so static routes are also stored as objects.
set -euo pipefail

if [[ -z "${DISTRIBUTION_ID:-}" ]]; then
  echo "CLOUDFRONT_DISTRIBUTION_ID is not set" >&2
  exit 1
fi

updated=0
if aws cloudfront get-distribution-config --id "$DISTRIBUTION_ID" > /tmp/cf.json; then
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
  updated=1
else
  echo "CloudFront distribution config is not writable by this user. Publishing static route objects instead."
fi

if [[ -z "${BUCKET:-}" ]]; then
  if [[ "$updated" -eq 1 ]]; then
    exit 0
  fi
  echo "AWS_BUCKET_NAME is not set" >&2
  exit 1
fi

copy_route() {
  aws s3 cp "s3://$BUCKET/index.html" "s3://$BUCKET/$1" \
    --content-type "text/html; charset=utf-8" \
    --cache-control "no-cache" \
    --metadata-directive REPLACE
}

for route in login signup dashboard submissions analytics; do
  copy_route "$route"
done

api="${PROBLEMS_API:-https://api.anandmishra.dev/api}"
page=1
while true; do
  json=$(curl -fsS "$api/problems?limit=100&page=$page")
  while IFS= read -r slug; do
    [[ "$slug" =~ ^[a-z0-9-]{1,80}$ ]] || continue
    copy_route "problem/$slug"
    copy_route "problem/$slug/analytics"
  done < <(jq -r '.problems[]?.slug // empty' <<<"$json")
  total_pages=$(jq -r '.totalPages // 1' <<<"$json")
  if [[ "$page" -ge "$total_pages" ]]; then
    break
  fi
  page=$((page + 1))
done

aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/login" "/signup" "/dashboard" "/submissions" "/analytics" "/problem/*"
