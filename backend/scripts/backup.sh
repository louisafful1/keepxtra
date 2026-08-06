#!/usr/bin/env bash
set -euo pipefail

# Dumps the database at $MONGODB_URI to a single timestamped, gzip-compressed
# archive (requires the MongoDB Database Tools — `mongodump` on PATH).
#
# Usage: ./scripts/backup.sh [output-dir] [retention-days]
#   output-dir       default: ./backups
#   retention-days   backups older than this are pruned after a successful run; default: 14

OUTPUT_DIR="${1:-./backups}"
RETENTION_DAYS="${2:-14}"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
ARCHIVE="$OUTPUT_DIR/keepxtra-backup-$TIMESTAMP.gz"

if [ -z "${MONGODB_URI:-}" ]; then
  echo "MONGODB_URI is not set. Export it first, e.g.:" >&2
  echo "  export \$(grep -v '^#' .env | xargs) && ./scripts/backup.sh" >&2
  exit 1
fi

mkdir -p "$OUTPUT_DIR"
echo "Backing up database -> $ARCHIVE"
mongodump --uri="$MONGODB_URI" --archive="$ARCHIVE" --gzip

echo "Pruning backups older than $RETENTION_DAYS days in $OUTPUT_DIR"
find "$OUTPUT_DIR" -name 'keepxtra-backup-*.gz' -mtime "+$RETENTION_DAYS" -print -delete

echo "Backup complete: $ARCHIVE"
