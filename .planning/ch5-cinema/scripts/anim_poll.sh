#!/usr/bin/env bash
# Poll pixellab for celebration animations; build spritesheets as they complete.
# Usage: anim_poll.sh <max_seconds> slug=id slug=id ...
# For each pending slug, repeatedly runs build_sheets.py (downloads zip, extracts
# festejo/north frames, writes anim/{slug}.png if ready). Exits when all built or timeout.
set -u
PY="/c/Python/Python37/python"
BS="/d/timeline-portfolio/.planning/ch5-cinema/scripts/build_sheets.py"
ANIM="/d/timeline-portfolio/public/assets/ch5-cinema/anim"
MAX="$1"; shift
declare -A P
for kv in "$@"; do P["${kv%%=*}"]="${kv#*=}"; done
el=0; iv=20
while [ ${#P[@]} -gt 0 ] && [ "$el" -lt "$MAX" ]; do
  args=()
  for s in "${!P[@]}"; do args+=("$s=${P[$s]}"); done
  "$PY" "$BS" "${args[@]}" >/dev/null 2>&1
  for s in "${!P[@]}"; do
    if [ -s "$ANIM/$s.png" ]; then echo "SHEET $s"; unset 'P[$s]'; fi
  done
  [ ${#P[@]} -eq 0 ] && break
  sleep "$iv"; el=$((el+iv))
done
echo "=== ANIM SUMMARY ==="
echo -n "PENDING:"; for s in "${!P[@]}"; do echo -n " $s=${P[$s]}"; done; echo
