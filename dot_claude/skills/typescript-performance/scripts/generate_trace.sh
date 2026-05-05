#!/bin/bash
# TypeScript Performance Trace Generator
# Usage: ./generate_trace.sh [project-path] [output-dir]

set -e

PROJECT_PATH="${1:-.}"
OUTPUT_DIR="${2:-$PROJECT_PATH/.trace_output}"

echo "🔍 Generating TypeScript performance trace..."
echo "   Project: $PROJECT_PATH"
echo "   Output: $OUTPUT_DIR"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Check if tsconfig.json exists
if [ ! -f "$PROJECT_PATH/tsconfig.json" ]; then
    echo "❌ Error: tsconfig.json not found in $PROJECT_PATH"
    exit 1
fi

# Run tsc with trace generation
echo "📊 Running tsc with --generateTrace..."
npx tsc -p "$PROJECT_PATH" \
    --generateTrace "$OUTPUT_DIR" \
    --incremental false \
    --extendedDiagnostics 2>&1 | tee "$OUTPUT_DIR/diagnostics.txt"

echo ""
echo "✅ Trace generated successfully!"
echo ""
echo "Output files:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Quick analysis: npx @typescript/analyze-trace $OUTPUT_DIR"
echo "2. Visual analysis: Open about://tracing in Chrome/Edge and load trace.*.json"
echo "3. Review diagnostics: cat $OUTPUT_DIR/diagnostics.txt"
