# Work schedule, task times and the new reward economy: design

Date: 2026-10-28 · Status: awaiting review

## Why

People with jobs on shifts (nurses, factory, retail, security, hospitality) keep their work schedule in a
spreadsheet, a photo of the rota, or a calendar app that handles changing shifts badly. Growra already helps
them with personal tasks; this adds their **work schedule next to their life**, as an optional extra, and lets
the companion keep them company through a long shift.

It is **personal only**: one person's own schedule on their own phone. No sharing, no server, no accounts —
Growra's listing promises "no accounts, no servers", and this keeps that promise.

Success looks like:

- a shift worker sets up their pattern once in a couple of minutes and then sees every future shift;
- a one-off change (a swapped shift, a different week) takes a few taps and never breaks the rest;
- ticking off a shift feels like confirming the day's work and pays properly for it;
- people who never use Work see the app exactly as before.

## Goals

1. A **Work** area inside the Tasks tab with **day and week views** of work items.
2. Work items with a **name, start and end time, and a repeat rule**, including exceptions for single
   occurrences.
3. Work items are real tasks: **completing one** gives coins, XP, Bond, streak and Journey progress, like any task.
4. **Every task** (personal too) can have an optional **time**; longer tasks pay more.
5. The **economy** is rebalanced: rewards go up, pay scales with length, the daily coin cap is removed, and
   shop prices go up so the shop keeps its value.
6. The **dashboard** splits Today into Personal and Work sections; the **calendar** gets Personal, Work and a
   "show both" view.
7. **Companion encouragement** during a running shift.

## Non-goals (this version)

- Sharing a schedule with a team, importing a rota from Excel or a picture, syncing with Google Calendar.
- Pay or overtime tracking in money.
- Mini-games (a Tamagotchi-style care game is a possible later idea; nothing here should block it).
- Changes to how companions join, evolve or what perks they have, apart from the reward amounts.

## Anti-goals (failure even if it "works")

- The app looks more complicated for someone who never opens Work.
- Editing one shift silently changes other days.
- Any existing task, streak, coin balance or companion is lost or changed by the update.
- Growra starts to feel like an employer's tool (rota management, approvals, other people's names).

## 1. The Tasks tab

Tapping **Tasks** shows a choice screen with two large boxes: **Personal** and **Work**. Each box shows a short
preview of today ("3 tasks today", "Shift 14:00–22:00", or "Not set up yet" for Work).

- **Personal** is today's Tasks screen, unchanged except for the new optional time on each task.
- **Work** is the new schedule screen (section 2).
- Growra **remembers the last choice** and opens straight into it next time; there is a way back to the
  choice screen from both (the builder picks the control).

## 2. The Work screen

- A **Day / Week** switch. Growra remembers the last one used.
- **Day view:** every work item that day, in time order, with start–end times. Arrows (and a swipe, if
  natural) move one day back or forward; a "Today" control jumps back.
- **Week view:** seven days side by side, each with its work items. Arrows move one week.
- An **Add** button creates a work item. Tapping an item opens it to complete, edit or delete.
- Empty state for first use: a short explanation and an "Add your first shift" button.

### A work item

- **Name**, written by the user ("Morning shift — Ward 3", "Team meeting").
- Optional **description** and colour, like personal tasks.
- **Start time and end time.** A shift can run past midnight (22:00–06:00); it belongs to the day it starts.
- **Repeat:** none, every day, every week (on chosen weekdays), every X days, every X weeks, every month.
  A rotation such as "2 days on, 2 off" is two items that repeat every 4 days, one starting a day later.
- **Ends:** never, after N times, or on a date.

### Changing one occurrence

Editing or deleting an item that repeats asks: **"Only this one"** or **"This and all following"**
(the same wording as phone calendars).

- *Only this one* changes or removes that single day; the pattern carries on unchanged.
- *This and all following* ends the old pattern the day before and starts a new one from that day.
- A whole week off is done by deleting each occurrence that week (or choosing a "skip this week" shortcut, if
  the builder finds it cheap); a replacement shift is just a new one-off item.

This needs a different data model from today's tasks (section 6).

## 3. Completing work items and companion support

- A work item can be ticked off **from when it starts** until the end of the next day (so a night shift can
  be confirmed the morning after). Ticking it off is the user confirming they worked it.
- It pays like any task, using the new length-based reward (section 4), and counts for the streak, Journey
  and companion Bond. Companion perks keep working (Tempo, Ember and so on apply as they do now).
- **Encouragement:** while a shift is running, the companion shows a short supportive line on the Work screen
  and on the dashboard Work section ("Halfway there!", "Last hour — you've got this", "Long one today; I'm
  here"). Lines depend on how far through the shift it is (start, middle, last hour) and come in English and
  Portuguese like all companion text. No new notifications in this version.

## 4. Task times and the reward economy

### Optional time on every task

Every task, personal or work, can have an optional **time**: a start and end time, or just a length
("about 45 minutes"). Tasks with a timer use the timer length. A task with no time is a **short task**.

### Rewards

Today a task pays `BASE_TASK_COIN_REWARD` (10) coins × the streak/companion multiplier, plus perk coins, and
coins stop after 15 tasks a day (`DAILY_COIN_TASK_CAP`).

The new rules:

- **No daily coin cap.** Coins are paid for every completed task. (Cheating is not defended against: Growra is
  single-player, coins can't be bought, and anyone inventing tasks only fools themselves.)
- **Pay grows with length.** A short task pays a base amount; longer tasks pay more, with diminishing returns
  so a 12-hour shift pays well but not 50× a short task. The builder models the curve; a starting point to test:
  base 15 coins for a short task, and length-based pay of about `15 + 10 × hours`, capped around 12 hours.
- **XP scales the same way.** Bond keeps its current rules, including its daily cap, so companions don't
  evolve in a few days.
- The streak and companion multipliers and perk coins still apply on top.

### Shop prices

Because players will earn noticeably more, **room styles, furniture and decorations get more expensive** in the
same release. The builder models an ordinary week (a few personal tasks a day, and for a shift worker four or
five shifts a week) and sets prices so a room style still takes a couple of weeks of normal use, a piece of
furniture a few days. Items already bought stay owned; coin balances are not changed.

## 5. Dashboard and calendar

### Dashboard

- The Today List becomes **two sections, Personal and Work**, each with a title.
- **Tapping a section title collapses or expands it**; Growra remembers which are collapsed.
- At the top of each section is **that section's next item** (the next to do, or the next to start for work).
- The **Work section is hidden** until the user has at least one work item, so people who never use Work see
  the dashboard as today. (The builder decides whether deleting every work item hides it again.)
- The pending-tasks count in the header counts both sections.

### Calendar

- Tasks → Personal → Calendar shows **personal tasks only**; Work has its own calendar, built from the week view
  or a month view (builder's choice).
- A **"Show both"** toggle merges work and personal items into one calendar, work in its own colour. Turning it
  off splits them again. Growra remembers the toggle.

## 6. Data and migration

Today a repeating task is **one record whose due date rolls forward** when completed (`getNextAvailableDate`,
`syncRecurringTasks`), and only DAILY, WEEKLY (= next week) and ONCE exist. That can't express "every 4 days",
"Mondays and Thursdays", "10 times", or "change only this one".

Work items therefore need a **repeat rule plus exceptions**, from which occurrences are generated for any day:

- a rule (frequency, interval, weekdays, start date, end: never / count / date), start and end time;
- exceptions per date: skipped, or replaced with different values;
- completion recorded **per occurrence date** (so completing Tuesday's shift doesn't touch Wednesday's).

Whether personal tasks move to the same model in this release or keep the current one is **the builder's call**;
the requirement is only that personal tasks gain the optional time and the reward change. Keeping personal tasks
on today's model is the lower-risk default.

The save format version goes up (it is 20 today, `SAVE_VERSION` in `src/utils/initialState.ts`), with a
migration that keeps every existing task, streak, coin balance, companion and room exactly as they are. Older
builds must refuse the newer save, as they already do.

The calendar export (CSV, Growra Plus) should include work items.

## 7. Constraints

- Expo / React Native app; follow the existing code style, `appCopy.ts` for all text in English and
  Portuguese, the existing themes and the 360 px-wide phone layout.
- Everything stays on the device; no network calls are added.
- Branch from `develop` (main = the released app) and keep `develop` releasable.
- The Play listing says "no accounts, no servers, no analytics"; nothing here may change that.

## 8. Decisions after the builder check (author's calls, 2026-10-28)

- **Prices are modelled on a Personal-only user** (a few short tasks a day): their earnings and the time to
  afford things stay about where they are today, so non-Work users notice nothing. Shift workers earn faster;
  that's intended, they do more. (This replaces the "couple of weeks" target in section 4: today a room style
  takes a few days, and that pace is kept.)
- **A late-confirmed shift counts on the day it's ticked**, like every task (streak, Journey, daily counters).
  A work occurrence is never "overdue" for perks.
- **A personal task's time only affects pay.** It doesn't lock completion, change order or put the task in the
  Work view; personal tasks keep today's data model with one new optional `durationMinutes` field.
- **The choice screen stays for everyone**, remembered after the first pick. While the first-run tutorial is
  active, Tasks always opens Personal so the tutorial steps still work.
- **Work is free.** Nothing in this design is a Growra Plus feature (the existing Plus CSV export simply
  includes work items).

## 9. Left to the builder

- Exact reward and price numbers (modelled, with the reasoning written in the PR).
- Visual design of the choice screen, day and week views, and the collapsible sections, within Growra's style.
- Whether "skip this week" and swipe navigation are included.
- The data model details and whether personal tasks share it.
- Encouragement line wording (a handful per stage, both languages).

## Later ideas (not in this version)

- Companion mini-games (a care game during breaks).
- A reminder before a shift starts.
- Importing a rota, and sharing a schedule by code.
