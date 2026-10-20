#!/usr/bin/env bash
# Prints the "## Milestones" section of ROADMAP.md from GitHub (open issues per milestone).
# Regenerate after filing or closing issues:  scripts/roadmap-milestones.sh  and paste over the section.
set -euo pipefail
REPO=${REPO:-pedro7161/Growra}
fmt='.[] | "- [ ] #\(.number) \(.title) (\([.labels[].name] | join(", ")))"'
echo "## Milestones"
gh api "repos/$REPO/milestones?state=open&sort=title" --jq '.[] | "\(.number)\t\(.title)\t\(.description // "")"' |
  while IFS=$'\t' read -r number title description; do
    echo; echo "### $title"; echo
    [ -n "$description" ] && { echo "$description"; echo; }
    gh issue list -R "$REPO" --state open --milestone "$title" --limit 100 --json number,title,labels --jq "sort_by(.number) | $fmt"
  done
echo; echo "### No milestone (owner decides whether and when)"; echo
gh issue list -R "$REPO" --state open --search "no:milestone" --limit 100 --json number,title,labels --jq "sort_by(.number) | $fmt"
