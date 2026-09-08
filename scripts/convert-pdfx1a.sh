#!/usr/bin/env bash
set -euo pipefail

INPUT="${1:-output/experiment-print-base.pdf}"
OUTPUT="${2:-output/experiment-print-pdfx1a.pdf}"

echo "🔁 Convirtiendo a PDF/X-1a con Ghostscript..."

gs \
  -dPDFX \
  -dBATCH \
  -dNOPAUSE \
  -dNOOUTERSAVE \
  -sProcessColorModel=DeviceCMYK \
  -sColorConversionStrategy=CMYK \
  -sDEVICE=pdfwrite \
  -dCompatibilityLevel=1.3 \
  -dAutoRotatePages=/None \
  -dFIXEDMEDIA \
  -sPAPERSIZE=a4 \
  -dEmbedAllFonts=true \
  -dSubsetFonts=true \
  -dDownsampleColorImages=false \
  -dDownsampleGrayImages=false \
  -dDownsampleMonoImages=false \
  -dDetectDuplicateImages=true \
  -dCompressFonts=true \
  -dCompressStreams=true \
  -sOutputFile="$OUTPUT" \
  "$INPUT"

echo "✅ PDF/X-1a generado en $OUTPUT"
