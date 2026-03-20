#!/bin/sh
set -eu

YYYYMMDD=$(date +"%Y%m%d")
HHMMSS=$(date +"%H-%M-%S")
EXT=""

while getopts "e:" opt; do
    case "$opt" in
    e) EXT="$OPTARG" ;;
    *)
        echo "Usage: $0 [-e <ext>] <file_name>" >&2
        exit 1
        ;;
    esac
done
shift $((OPTIND - 1))

if [ -z "${1:-}" ]; then
    echo "Usage: $0 [-e <ext>] <file_name>" >&2
    exit 1
fi

FILE_NAME="$1"
case "$FILE_NAME" in
*.*)
    # File name already has an extension; ignore -e
    ;;
*)
    if [ -n "$EXT" ]; then
        FILE_NAME="${FILE_NAME}.${EXT}"
    fi
    ;;
esac

TARGET_PATH="$BASE_DIR/$YYYYMMDD/$HHMMSS-$FILE_NAME"
mkdir -p "$(dirname "$TARGET_PATH")"

touch "$TARGET_PATH"
echo "Created empty file: $TARGET_PATH" >&2
echo "$TARGET_PATH" >&1 # For pipe output
