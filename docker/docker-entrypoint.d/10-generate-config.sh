#!/bin/sh
set -eu

: "${SUPABASE_URL:=http://127.0.0.1:54321}"
: "${SUPABASE_ANON_KEY:=}"
: "${AUDIO_BASE_URL:=../audio_zundamon/}"
: "${TOKEN_PREFIX:=khb-}"
: "${TOKEN_LENGTH:=32}"

export SUPABASE_URL SUPABASE_ANON_KEY AUDIO_BASE_URL TOKEN_PREFIX TOKEN_LENGTH

if [ -z "$SUPABASE_ANON_KEY" ]; then
  echo "warning: SUPABASE_ANON_KEY is empty; browser clients will not connect to Supabase" >&2
fi

envsubst '${SUPABASE_URL} ${SUPABASE_ANON_KEY} ${AUDIO_BASE_URL} ${TOKEN_PREFIX} ${TOKEN_LENGTH}' \
  < /usr/share/nginx/html/js/config.template.js \
  > /usr/share/nginx/html/js/config.js
