# Growra roadmap

Open work lives in GitHub issues, grouped into numbered milestones: https://github.com/pedro7161/Growra/milestones
This file is the overview; the issues hold the detail and the "Done when" checklists.

## How the work moves

- Work on the **lowest-numbered open milestone** first. That is the current objective.
- Inside it: `P1` > `P2` > `P3`. `blocked` waits on something outside the code; `needs-decision` waits on the owner; `needs-preview` starts with a preview the owner approves.
- A PR/merge that says `Fixes #N` closes the issue. When a milestone's issues are all closed, close the milestone and move to the next.
- New bugs and ideas become issues in the right milestone (not notes in files).
- The agent team (`.claude/agents/`: issue-triager, developer, reviewer) follows this file.

## Milestones

### 1 - Next update: fixes

Small fixes from review before the next tester update.

- [ ] #40 Streak and recurring tasks look stale while the app sits in the background (bug, P3)
- [ ] #42 Companion rooms: small fixes from review (bug, P3)
- [ ] #43 Growra Plus and ads: small fixes from review (bug, P2)
- [ ] #46 Error boundary + corrupt-save recovery hardening (bug, P1)
- [ ] #47 Custom task with empty category silently fails to save (bug, P1)
- [ ] #48 Accessibility pass: labels, hitSlop, text wrap at large font scale (enhancement, P2)
- [ ] #49 Backup code export/import: copy/share button, import confirmation (enhancement, P2)
- [ ] #50 Save schema versioning: read version, refuse newer saves, snapshot before overwrite (chore, P2)
- [ ] #51 Verify AdMob rewarded-ad fill before/during closed testing (chore, P1)

### 2 - Notifications

Timer alerts in the background and an optional daily reminder (expo-notifications).

- [ ] #38 Timer alerts only fire while the app is open (enhancement, P2)
- [ ] #39 Optional daily reminder (enhancement, P2, needs-decision)

### 3 - Companion rooms phase 2

Room codes, QR, copy a room, ghosts.

- [ ] #41 Companion rooms phase 2: room codes, QR, copy a room, ghosts (enhancement, P2)

### 4 - Production & monetization

Public listing, real AdMob ids, Plus perks.

- [ ] #44 Switch AdMob to real ids once the app has a public listing (P2, chore, blocked)
- [ ] #45 Growra Plus later perks (enhancement, needs-decision, later)

### Awaiting owner decision

Not in a milestone yet — the owner approves, drops, or reorders these.

- [ ] #55 Decision table: next steps to production (2026-10-16) — full recommendation, needs owner sign-off
- [ ] #52 Quick-add task row (name only, lands today) (enhancement, needs-decision)
- [ ] #53 Passive return experience: look-back recap + companion welcome-back line (enhancement, needs-decision)
- [ ] #54 One-time backup reminder nudge (enhancement, needs-decision)

## Notes

Design detail for each item: `Documents/ROADMAP.md`, `Documents/GAME_REDESIGN.md`, `docs/superpowers/`.
