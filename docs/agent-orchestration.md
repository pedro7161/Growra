# Multi-agent development workflow — Growra

Read README.md and Documents/PROJECT_SPEC.md first. This is an **Expo 54 / React Native / TypeScript Android-first task app**, not a Unity game. Follow product scope: local-only storage, no accounts/backend, optional planning features, honest self-accountability, companions, journey and streaks. This document governs workflow, not new product requirements.

## Agent orchestration and safety
- Main coordinator: Haiku 5.5 Medium when supported; coordinate, decompose, track dependencies, integrate, and verify rather than doing substantial implementation itself.
- Haiku low: focused exploration, simple edits, build/test execution, log collection, documentation, screenshot capture, and bounded searches. Increase effort only if the task warrants it.
- Sonnet Medium: primary feature implementation, test design, integration, substantive debugging and reviews.
- Opus Medium: complex architecture, difficult concurrency/physics/persistence problems, hard unresolved bugs; never routine searches or test collection.
- Use the least expensive capable agent. Verify actual model/effort through supported metadata when available; never invent guarantees. Fall back to supported models instead of blocking.
- Parallelize independent work with clear ownership; serialize edits of shared files, project/build state, release metadata and main-branch integration. Independent review and evidence are required before declaring verified.
- If the installed Caveman skill is accessible to the *agent*, read its documented instructions and use it for low-information completion tasks. Never invent an invocation. If unavailable, use normal execution with brief DONE/FAILED/BLOCKED plus artifact references. Compact reporting must not erase test evidence.
- Prefer RTK when installed and useful. On failure, use narrowly scoped, bounded commands (git ls-files, targeted rg --files / rg). Never launch recursive searches over /, mounts, caches or all worktrees as a fallback.
- Keep logs, screenshots and test results accessible; do not conflate a passing build, test execution, simulator run and visual verification.
- Avoid uncontrolled retries. Diagnose failures; escalate selectively. Keep a durable task ledger for resumed work; do not promise indefinite background execution.
- Work from latest upstream and preserve uncommitted user work. Use isolated worktrees for agents, review changes, test integrated state, push only authorized verified changes. Never force-push or delete uncommitted work.

## Growra-specific delegation
- Haiku Low: bounded repository searches, inspect components and utilities, run typecheck/lint/Jest, collect concise failures, update documentation and capture app screenshots with available tooling.
- Sonnet Medium: React Native UI/state flows, task scheduling, rewards, companions, persistence and migration changes, accessibility, and integration tests.
- Opus Medium only for hard data migrations, time/calendar invariants, multi-feature consistency, or repeated tricky regressions after evidence-driven Sonnet debugging.
- Separate code ownership by domain (src/utils, src/services, screens/components) and do not concurrently modify central src/App.tsx or release configuration.
- Required checks for relevant changes: `npx tsc --noEmit`, `npm run lint`, `npm test` (Jest timezone is Europe/Lisbon). Add targeted tests for DST, recurring resets, streaks, coin/XP/Bond rewards, and local-state upgrades when touched.
- For UI work, launch Expo on Android emulator/device when available. Capture **real** before/after screens, check navigation, touch targets, legibility and persistence across restart. Do not claim emulator validation if it was not run.
- Test ordinary and corrupted/migrated AsyncStorage states, offline use, update survival and non-loss of user tasks. Avoid server/cloud assumptions.
- Do not automatically increment release versions, submit to Play, change AdMob/privacy declarations or publish a build without explicit release authorization.
- Small completed features should be runnable in the app and independently checked; code compilation alone is not a user-facing test.

## Verification handoff
Record task, changed paths, typecheck/lint/Jest outcomes, Android runtime/screenshots when relevant, local persistence checks, limitations, and commit. Keep output short for routine agents and full evidence for risky changes.

## Example agent handoff
Coordinator (Haiku Medium) -> Sonnet Medium implements one task-and-rewards feature -> Haiku Low executes typecheck/lint/Jest -> separate Android UI verification -> Sonnet addresses failures -> coordinator checks evidence and integrates approved work.
