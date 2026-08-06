#!/usr/bin/env bash
set -euo pipefail

# Restores a backup archive created by backup.sh. DESTRUCTIVE — drops and
# replaces every collection present in the archive on the target database
# (requires the MongoDB Database Tools — `mongorestore` on PATH).
#
# Usage: ./scripts/restore.sh <archive-path> [--force]
#   --force   skip the interactive confirmation prompt (for scripted/CI use)

ARCHIVE="${1:-}"
FORCE_FLAG="${2:-}"

if [ -z "$ARCHIVE" ] || [ ! -f "$ARCHIVE" ]; then
  echo "Usage: ./scripts/restore.sh <archive-path> [--force]" >&2
  exit 1
fi

if [ -z "${MONGODB_URI:-}" ]; then
  echo "MONGODB_URI is not set. Export it first, e.g.:" >&2
  echo "  export \$(grep -v '^#' .env | xargs) && ./scripts/restore.sh <archive-path>" >&2
  exit 1
fi

if [ "$FORCE_FLAG" != "--force" ]; then
  echo "This will DROP every collection in the target database and replace it with:"
  echo "  $ARCHIVE"
  echo "Target: $MONGODB_URI"
  read -r -p "Type 'yes' to continue: " CONFIRM
  if [ "$CONFIRM" != "yes" ]; then
    echo "Aborted — no changes made."
    exit 1
  fi
fi

echo "Restoring $ARCHIVE -> database"
mongorestore --uri="$MONGODB_URI" --archive="$ARCHIVE" --gzip --drop

echo "Restore complete."
