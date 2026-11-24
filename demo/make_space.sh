#!/usr/bin/env bash
# Assemble a folder that can be pushed as-is to a Hugging Face Docker Space.
# Usage (from the repository root):  bash demo/make_space.sh [output-dir]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-$ROOT/../bayan-space}"

mkdir -p "$OUT"
rm -rf "$OUT/demo" "$OUT/src" "$OUT/data"
mkdir -p "$OUT/src" "$OUT/data"
cp -R "$ROOT/src/bayan" "$OUT/src/bayan"
cp -R "$ROOT/data/sample" "$OUT/data/sample"
cp -R "$ROOT/demo" "$OUT/demo"
rm -rf "$OUT/demo/__pycache__" "$OUT/src/bayan/__pycache__"
cp "$ROOT/demo/Dockerfile" "$OUT/Dockerfile"

cat > "$OUT/README.md" <<'EOF'
---
title: Bayan · بيان
emoji: 📝
colorFrom: green
colorTo: yellow
sdk: docker
app_port: 7860
pinned: false
short_description: Arabic & English service-request topic and bilingual search
---

# بيان | Bayan — try it

Type an Arabic or English service request: Bayan predicts its topic (TF-IDF + LinearSVC
baseline) and finds the closest past case with multilingual semantic search, including
across languages. All data is synthetic SDAIA Academy course data.

Code, notebooks and evaluation: https://github.com/lolo67fa/bayan-nlp-ghalaalshreef-sdaia
EOF

echo "Space folder ready: $OUT"
