#!/usr/bin/env bash
# A simple preview when Chrome cannot run; the HTML is the canonical design.
set -euo pipefail
cd "$(dirname "$0")/.."
FONT="${FONT:-/System/Library/Fonts/Supplemental/Georgia Bold.ttf}"
BODY_FONT="${BODY_FONT:-/System/Library/Fonts/Supplemental/Arial.ttf}"
magick -size 1200x630 xc:'#F4F1EA' \
  -fill '#0000EE' -draw 'rectangle 0,0 1200,16' \
  -fill '#111111' -font "$FONT" -pointsize 132 -annotate +72+260 'notx' \
  -fill '#0000EE' -draw 'rectangle 405,130 815,285' \
  -fill white -annotate +415+260 '.blue' \
  -fill '#111111' -font "$BODY_FONT" -pointsize 38 -annotate +72+380 'Projetos para o Bluesky.' \
  -pointsize 24 -annotate +72+510 'por @joseli.to' og.png
cp og.png share.png
