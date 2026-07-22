# Graph Report - .  (2026-07-22)

## Corpus Check
- Large corpus: 135 files · ~2,140,152 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 584 nodes · 1356 edges · 53 communities (25 shown, 28 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 14 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Task & Navigation UI
- App Layout & Tutorial
- Screens & Tabs
- App Config & Icons
- Game Design Concepts
- Lint & Test Tooling
- Gameplay Systems (pets/expedition)
- Settings & Changelog
- Task Date Picker
- Pets Screen & Expedition Map
- Pet Asset Generator
- Battle Reward Modal
- Summon & Pet Cards
- TypeScript Config
- Gear & Battle Preview
- Expo Dependencies
- Reset Project Script
- Community 17
- Community 18
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 31
- Community 32
- Community 33
- Community 35
- Community 36
- Community 37
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47

## God Nodes (most connected - your core abstractions)
1. `getAppTheme()` - 43 edges
2. `getAppCopy()` - 30 edges
3. `App()` - 29 edges
4. `AppSettings` - 25 edges
5. `getStartOfDay()` - 19 edges
6. `Task` - 17 edges
7. `expo` - 16 edges
8. `getPredefinedTask()` - 16 edges
9. `Growra (Gamified Task Management App)` - 16 edges
10. `MapExplorerModal()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Expo Router (file-based routing)` --conceptually_related_to--> `Navigation & Screens`  [INFERRED]
  README.md → Documents/PROJECT_SPEC.md
- `TabLayout()` --indirect_call--> `HapticTab()`  [INFERRED]
  app/(tabs)/_layout.tsx → components/haptic-tab.tsx
- `Growra Expo App (README)` --implements--> `Tech Direction (React Native + Expo, TypeScript)`  [INFERRED]
  README.md → Documents/PROJECT_SPEC.md
- `ParallaxScrollView()` --calls--> `useThemeColor()`  [EXTRACTED]
  components/parallax-scroll-view.tsx → hooks/use-theme-color.ts
- `ThemedText()` --calls--> `useThemeColor()`  [EXTRACTED]
  components/themed-text.tsx → hooks/use-theme-color.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Core Task-to-Pet Reward Loop** — documents_project_spec_task_system, documents_project_spec_reward_system, documents_project_spec_pet_system, documents_project_spec_streak_system [INFERRED 0.85]
- **Gacha and Duplicate Management Economy** — documents_project_spec_economy_system, documents_project_spec_gacha_system, documents_project_spec_pity_shop, documents_project_spec_fusion_system [INFERRED 0.80]
- **Main App Screens Ecosystem** — documents_project_spec_dashboard, documents_project_spec_navigation, documents_project_spec_task_system, documents_project_spec_pet_system [INFERRED 0.75]

## Communities (53 total, 28 thin omitted)

### Community 0 - "Task & Navigation UI"
Cohesion: 0.07
Nodes (67): AddTaskModal(), AddTaskModalProps, ChipButton(), FrequencyButton(), getPriorityLabel(), styles, TaskFormValues, TypeButton() (+59 more)

### Community 1 - "App Layout & Tutorial"
Cohesion: 0.07
Nodes (60): App(), applyTutorialReward(), getTutorialStep(), Screen, shouldCompleteTutorial(), styles, TaskTutorialUiState, TutorialStep (+52 more)

### Community 2 - "Screens & Tabs"
Cohesion: 0.09
Nodes (26): styles, styles, styles, TabLayout(), ExternalLink(), Props, HapticTab(), HelloWave() (+18 more)

### Community 3 - "App Config & Icons"
Cohesion: 0.05
Nodes (37): backgroundColor, backgroundImage, foregroundImage, monochromeImage, adaptiveIcon, edgeToEdgeEnabled, package, predictiveBackGestureEnabled (+29 more)

### Community 4 - "Game Design Concepts"
Cohesion: 0.09
Nodes (37): activeImageVariantId, Adventure System, Architecture Principles, AsyncStorage, Backup System, Coding Rules, Cosmetic Variants, Main Screen (Dashboard) (+29 more)

### Community 5 - "Lint & Test Tooling"
Cohesion: 0.06
Nodes (35): eslint, eslint-config-expo, identity-obj-proxy, jest, jest-environment-jsdom, devDependencies, eslint, eslint-config-expo (+27 more)

### Community 6 - "Gameplay Systems (pets/expedition)"
Cohesion: 0.08
Nodes (35): BattleConsumableKind, ExpeditionNodeType, ExpeditionProgress, PetImages, PetRarity, PetStats, addStats(), applyExpeditionNodeReward() (+27 more)

### Community 7 - "Settings & Changelog"
Cohesion: 0.10
Nodes (25): OptionButton(), SettingsModal(), SettingsModalProps, StatRow(), styles, AppTheme, appThemes, changelogByLanguage (+17 more)

### Community 8 - "Task Date Picker"
Cohesion: 0.13
Nodes (25): addMonths(), buildMonthGrid(), DayCellData, formatTaskDate(), getLocale(), getMonthLabel(), getMonthStart(), getWeekdayLabels() (+17 more)

### Community 9 - "Pets Screen & Expedition Map"
Cohesion: 0.14
Nodes (24): EXPEDITION_REGIONS, GearInventoryPanel(), getGearFlavorText(), getMapConnectorLine(), MapExplorerModal(), MapNodeRect, PetsScreen(), styles (+16 more)

### Community 10 - "Pet Asset Generator"
Cohesion: 0.31
Nodes (15): Image, ImageDraw, add_glow(), add_particles(), add_theme_effects(), build_pet_assets(), draw_sparkle(), enhance_stage() (+7 more)

### Community 11 - "Battle Reward Modal"
Cohesion: 0.20
Nodes (15): BattleReplayFrame, BattleReplayPlan, BattleRewardModal(), BattleRewardModalProps, createBattleReplayPlan(), styles, SummonRevealModalProps, BattleConsumableItem (+7 more)

### Community 12 - "Summon & Pet Cards"
Cohesion: 0.22
Nodes (12): ConfettiPiece, createConfettiPieces(), styles, SummonRevealModal(), getPetImage(), PET_IMAGES, PetCard(), PetDetailModal() (+4 more)

### Community 13 - "TypeScript Config"
Cohesion: 0.17
Nodes (11): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, nativewind-env.d.ts, **/*.ts, **/*.tsx, compilerOptions, paths (+3 more)

### Community 14 - "Gear & Battle Preview"
Cohesion: 0.20
Nodes (11): boostGearRarity(), createGearDrop(), getBattleConsumableBonus(), getBattleConsumableEffectTotals(), getBattleConsumablesForLoadout(), getBattleLoadoutPower(), getExpeditionBattlePreview(), getExpeditionEncounter() (+3 more)

### Community 15 - "Expo Dependencies"
Cohesion: 0.22
Nodes (9): expo, expo-constants, expo-haptics, dependencies, expo, expo-constants, expo-haptics, react-dom (+1 more)

### Community 16 - "Reset Project Script"
Cohesion: 0.22
Nodes (7): exampleDirPath, fs, oldDirs, path, readline, rl, root

### Community 17 - "Community 17"
Cohesion: 0.50
Nodes (3): config, { getDefaultConfig }, { withNativeWind }

## Knowledge Gaps
- **171 isolated node(s):** `name`, `slug`, `version`, `orientation`, `icon` (+166 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **28 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Expo Dependencies` to `Lint & Test Tooling`, `Community 20`, `Community 21`, `Community 22`, `Community 23`, `Community 24`, `Community 25`, `Community 26`, `Community 27`, `Community 28`, `Community 29`, `Community 30`, `Community 31`, `Community 32`, `Community 33`, `Community 35`, `Community 36`, `Community 37`, `Community 38`, `Community 39`, `Community 40`, `Community 41`, `Community 42`, `Community 43`, `Community 44`, `Community 45`, `Community 46`, `Community 47`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `getAppTheme()` connect `Task & Navigation UI` to `App Layout & Tutorial`, `Settings & Changelog`, `Task Date Picker`, `Pets Screen & Expedition Map`, `Battle Reward Modal`, `Summon & Pet Cards`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Are the 4 inferred relationships involving `App()` (e.g. with `finishTaskTimer()` and `pauseTaskTimer()`) actually correct?**
  _`App()` has 4 INFERRED edges - model-reasoned connections that need verification._
- **What connects `name`, `slug`, `version` to the rest of the system?**
  _171 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Task & Navigation UI` be split into smaller, more focused modules?**
  _Cohesion score 0.07377295995182175 - nodes in this community are weakly interconnected._
- **Should `App Layout & Tutorial` be split into smaller, more focused modules?**
  _Cohesion score 0.06829488919041157 - nodes in this community are weakly interconnected._
- **Should `Screens & Tabs` be split into smaller, more focused modules?**
  _Cohesion score 0.09082125603864734 - nodes in this community are weakly interconnected._