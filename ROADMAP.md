# Growra roadmap

Open work lives in GitHub issues, grouped into numbered milestones: https://github.com/pedro7161/Growra/milestones
This file is the overview; the issues hold the detail and the "Done when" checklists.

## How the work moves

- Work on the **lowest-numbered open milestone** first. That is the current objective.
- Inside it: `P1` > `P2` > `P3`. `blocked` waits on something outside the code; `needs-decision` waits on the owner; `needs-preview` starts with a preview the owner approves.
- A PR/merge that says `Fixes #N` closes the issue. When a milestone's issues are all closed, close the milestone and move to the next.
- New bugs and ideas become issues in the right milestone (not notes in files).
- The agent team (`.claude/agents/`: issue-triager, developer, reviewer) follows this file.
- **Keeping it in sync:** the Milestones section is generated from GitHub. After filing or closing issues, run `scripts/roadmap-milestones.sh` and paste its output over that section. GitHub wins if the two ever disagree.

## Milestones

### 1 - Next update: fixes

Small fixes from review before the next tester update.

- [ ] #48 Verify AdMob rewarded-ad fill before/during closed testing (P1, chore)
- [ ] #55 Decision table: next steps to production (2026-10-16) (needs-decision)

### 2 - Notifications

Timer alerts in the background and an optional daily reminder (expo-notifications).

- [ ] #38 Timer alerts only fire while the app is open (enhancement, P2)
- [ ] #39 Optional daily reminder (enhancement, P2)

### 3 - Companion rooms phase 2

Room codes, QR, copy a room, ghosts.

- [ ] #41 Companion rooms phase 2: room codes, QR, copy a room, ghosts (enhancement, P2)

### 4 - Production & monetization

Public listing, real AdMob ids, Plus perks.

- [ ] #44 Switch AdMob to real ids once the app has a public listing (P2, chore, blocked)
- [ ] #45 Growra Plus later perks (enhancement, later)
- [ ] #59 Add button has no disabled state while the task name is blank (enhancement, P3, needs-preview, later)
- [ ] #63 Plus purchase: does ErrorCode.DuplicatePurchase also mean already-owned? (bug, P3, blocked, later)

### No milestone (owner decides whether and when)

- [ ] #53 Passive return experience: look-back recap + companion welcome-back line (enhancement, P2)
- [ ] #54 One-time backup reminder nudge (enhancement, P2)

## Notes

Design detail for each item: `Documents/ROADMAP.md`, `Documents/GAME_REDESIGN.md`, `docs/superpowers/`. Those are design documents; they don't track issue state.
Decision-table session recap: #55.
