#!/usr/bin/env bash
# Poll pixellab backblaze north.png URLs for a set of slug=id pairs.
# Downloads each to public/assets/ch5-cinema/{slug}.png when available.
# Usage: poll_dl.sh <max_seconds> slug=id slug=id ...
set -u
BASE="https://backblaze.pixellab.ai/file/pixellab-characters/18d52b53-7235-434e-a62f-90a3d1e6d1f1"
DEST="/d/timeline-portfolio/public/assets/ch5-cinema"
MAX="$1"; shift
declare -A PEND
for pair in "$@"; do PEND["${pair%%=*}"]="${pair#*=}"; done
elapsed=0; interval=15
done_list="";
while [ ${#PEND[@]} -gt 0 ] && [ "$elapsed" -lt "$MAX" ]; do
  for slug in "${!PEND[@]}"; do
    id="${PEND[$slug]}"
    url="${BASE}/${id}/rotations/north.png"
    code=$(curl -s -o "${DEST}/${slug}.png.tmp" -w "%{http_code}" "$url")
    if [ "$code" = "200" ] && [ -s "${DEST}/${slug}.png.tmp" ]; then
      mv "${DEST}/${slug}.png.tmp" "${DEST}/${slug}.png"
      echo "DONE ${slug}"
      done_list="${done_list} ${slug}=${id}"
      unset 'PEND[$slug]'
    else
      rm -f "${DEST}/${slug}.png.tmp"
    fi
  done
  [ ${#PEND[@]} -eq 0 ] && break
  sleep "$interval"; elapsed=$((elapsed+interval))
done
echo "=== POLL SUMMARY ==="
echo "DOWNLOADED:${done_list}"
echo -n "STILL_PENDING:"; for slug in "${!PEND[@]}"; do echo -n " ${slug}=${PEND[$slug]}"; done; echo
