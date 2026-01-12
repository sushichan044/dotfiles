#!/bin/sh

YYYYMMDD=$(date +"%Y%m%d")
HHMMSS=$(date +"%H%M%S")

if [ -n "$1" ]; then
    DIR_NAME="$1"
else
    DIR_NAME="$HHMMSS"
fi

TARGET_DIR="$BASE_DIR/$YYYYMMDD/$DIR_NAME"
mkdir -p "$TARGET_DIR"

echo "Created temporary directory: $TARGET_DIR" >&2
echo "$TARGET_DIR" >&1 # For pipe output
