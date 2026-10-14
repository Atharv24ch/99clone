#!/bin/bash
set -e

echo "Initializing LocalStack S3 bucket..."
awslocal s3 mb s3://acres99-media --region ap-south-1
awslocal s3api put-bucket-cors --bucket acres99-media --cors-configuration '{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": ["http://localhost:3000", "http://localhost:3001"],
      "MaxAgeSeconds": 3000
    }
  ]
}'
echo "S3 bucket acres99-media created with CORS."
