# Quest System - SQL Reference

Complete quest/achievement system with 12 active quests (Phase 1 + Phase 2).

## Quick Start

### Fresh Deployment
Execute `DEPLOY_ALL_QUESTS.sql` in Supabase SQL Editor - this single file contains everything!

### What It Does
- Creates/updates all PostgreSQL functions
- Adds new metric types to constraints
- Creates 12 quests with proper XP rewards
- Total: 4,220 XP available

## Files

### DEPLOY_ALL_QUESTS.sql
**Complete deployment in one file** - Contains:
- All PostgreSQL functions (Phase 1 + Phase 2)
- Metric type constraint updates
- All 12 quest definitions
- Verification queries

Execute this file and you're done! ✅

### 000_check_quest_system.sql
Diagnostic queries to verify deployment:
- List all active quests
- Check user progress
- Verify XP transactions

### 001_create_quest_tables.sql
Table definitions (reference only):
- `achievement_quests` - Quest definitions
- `user_achievement_quest_progress` - User progress
- `xp_transactions` - XP history
- `user_inventory` - Rewards
- `active_boosts` - Active XP boosts

### 002_create_quest_functions.sql
Function signatures (reference only) - actual implementations in DEPLOY_ALL_QUESTS.sql

### QUEST_DESIGN_COMPLETE.md
Complete quest roadmap up to Phase 6 (37 quests planned)

## Current Quests (12 total)

### Days with Habit (3 quests)
1. **Sept Étincelles** - 7 days → 40 XP
2. **Deux Semaines Douces** - 30 days → 80 XP
3. **Dérive de Trente Jours** - 60 days → 150 XP

### Complete Days (4 quests)
4. **Jour Parfait** - 1 day → 150 XP
5. **Semaine Parfaite** - 7 days → 300 XP
6. **Perfection de Trois Semaines** - 21 days → 500 XP
7. **Mois Impeccable** - 30 days → 1000 XP

### Best Habit Streak (5 quests)
8. **Première Étincelle de Constance** - 7 days → 100 XP
9. **Rituel de Trois Semaines** - 21 days → 200 XP
10. **Mois de Dévotion** - 30 days → 400 XP
11. **Marathonien des Habitudes** - 60 days → 800 XP
12. **Légende Inébranlable** - 100 days → 1500 XP

**Total XP: 4,220 XP**

## Implemented Metrics

- ✅ `days_with_habit` - Distinct days with ≥1 habit completed
- ✅ `complete_days` - Days where ALL habits completed
- ✅ `best_habit_streak` - Maximum consecutive days (historical)
- ✅ `same_habit_days` - Distinct days for same habit

## Features

- ✅ Automatic progress updates on task completion
- ✅ Historical data analysis (past achievements count)
- ✅ XP duplicate prevention
- ✅ Auto-refresh on quest screen
- ✅ Quest-specific icons & translations (FR/EN)
- ✅ Topaz/Orange theme throughout

## Next Phases

See `QUEST_DESIGN_COMPLETE.md` for full roadmap:
- Phase 3: Task count & diversity metrics (+8 quests)
- Phase 4: Resilience metrics (+7 quests)
- Phase 5: Milestone metrics (+5 quests)
- Phase 6: Special actions (+5 quests)

**Target: 37 total quests**

## Documentation

Complete feature documentation: `/quests_feature_summary.md`
