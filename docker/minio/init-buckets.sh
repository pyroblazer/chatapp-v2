#!/bin/sh
set -e

# Wait for MinIO to be ready
until curl -sf http://localhost:9000/minio/health/live > /dev/null 2>&1; do
  sleep 1
done

# Create buckets if they don't exist
for bucket in chatapp-uploads chatapp-avatars chatapp-attachments; do
  if ! mc alias set local http://localhost:9000 "${MINIO_ROOT_USER:-minioadmin}" "${MINIO_ROOT_PASSWORD:-minioadmin}" > /dev/null 2>&1; then
    echo "Failed to set mc alias"
    exit 1
  fi
  mc mb --ignore-existing "local/${bucket}" 2>/dev/null || true
  mc anonymous set download "local/${bucket}" 2>/dev/null || true
done

echo "MinIO buckets initialized"
