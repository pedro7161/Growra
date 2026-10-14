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

## Notes

Design detail for each item: `Documents/ROADMAP.md`, `Documents/GAME_REDESIGN.md`, `docs/superpowers/`.
