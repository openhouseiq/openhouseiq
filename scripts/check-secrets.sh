#!/usr/bin/env bash
# Blocks API keys, tokens and private keys from being committed.
# Runs automatically before every commit (see .git/hooks/pre-commit) and can
# be run by hand with:  npm run check:secrets
#
# Secrets belong in environment variables (Netlify settings and the local
# .env.local file), never in code.

set -euo pipefail

PATTERN='(sk_live_[0-9A-Za-z]{10,}|sk_test_[0-9A-Za-z]{10,}|rk_(live|test)_[0-9A-Za-z]{10,}|whsec_[0-9A-Za-z]{10,}|pk_live_[0-9A-Za-z]{10,}|re_[0-9A-Za-z]{20,}|eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}|AKIA[0-9A-Z]{16}|AIza[0-9A-Za-z_-]{30,}|EAA[0-9A-Za-z]{40,}|gh[pousr]_[0-9A-Za-z]{30,}|xox[baprs]-[0-9A-Za-z-]{10,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|sb_secret_[0-9A-Za-z_]{10,})'

if [ "${1:-}" = "--staged" ]; then
  FILES=$(git diff --cached --name-only --diff-filter=ACM)
else
  FILES=$(git ls-files)
fi

FILES=$(printf '%s\n' "$FILES" | grep -vE '(^|/)(package-lock\.json|\.env\.local\.example)$' || true)
[ -z "$FILES" ] && exit 0

if [ "${1:-}" = "--staged" ]; then
  HITS=$(printf '%s\n' "$FILES" | while IFS= read -r f; do
    git show ":$f" 2>/dev/null | grep -nEI "$PATTERN" | sed "s|^|$f:|" || true
  done)
else
  HITS=$(printf '%s\n' "$FILES" | xargs grep -nEI "$PATTERN" 2>/dev/null || true)
fi

if [ -n "$HITS" ]; then
  echo "Blocked: something that looks like an API key or secret was found:" >&2
  printf '%s\n' "$HITS" | cut -c1-120 >&2
  echo "" >&2
  echo "Move it to an environment variable and read it with process.env." >&2
  exit 1
fi
echo "No keys or secrets found."
