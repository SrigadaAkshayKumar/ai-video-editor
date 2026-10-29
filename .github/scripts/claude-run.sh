#!/usr/bin/env bash
# Run one unattended Claude Code step for the long-form workflow, with a time budget.
# Usage: .github/scripts/claude-run.sh <log.jsonl> <minutes> <prompt>
# Exit 0 = done. On a usage/session limit it writes claude-limit.txt (epoch of the reset when Claude says it, else 0)
# and exits 75; on running out of the time budget it exits 124. The workflow then saves progress and re-dispatches.
log=$1; mins=$2; prompt=$3
[ "$mins" -lt 5 ] && { echo "no time left in this run"; exit 124; }
timeout "${mins}m" claude -p "$prompt" --dangerously-skip-permissions --output-format stream-json --verbose > "$log"
code=$?
[ $code -eq 124 ] && { echo "Claude step stopped: time budget of $mins min used"; exit 124; }
# the final result event says why it stopped
tail -c 20000 "$log" | grep -E '"type":"result"' | tail -1 > claude-result.json || true
if grep -qiE 'usage limit|limit reached|hit your limit|rate.?limit|session limit|out of (extra )?usage' claude-result.json 2>/dev/null; then
  epoch=$(grep -oE 'limit reached\|[0-9]{10}' claude-result.json | grep -oE '[0-9]{10}' | head -1)
  echo "${epoch:-0}" > claude-limit.txt
  echo "Claude hit its usage limit (reset epoch: ${epoch:-unknown})"
  exit 75
fi
if [ $code -ne 0 ] || grep -q '"is_error":true' claude-result.json 2>/dev/null; then
  echo "Claude step failed (exit $code)"; cat claude-result.json | head -c 2000; exit 1
fi
exit 0
