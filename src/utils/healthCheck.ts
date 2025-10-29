// src/utils/healthCheck.ts
import { supabase } from '@/lib/supabase';
import { getTodayString } from './dateHelpers';

interface HealthCheckResult {
  category: string;
  status: 'ok' | 'error' | 'warning';
  message: string;
  details?: any;
}

export class HealthCheckService {
  static async runFullDiagnostic(userId: string): Promise<HealthCheckResult[]> {
    const results: HealthCheckResult[] = [];

    console.log('🏥 Starting Health Check for user:', userId);
    console.log('='.repeat(50));

    // 1. Check Database Connection
    results.push(await this.checkDatabaseConnection());

    // 2. Check User Profile
    results.push(await this.checkUserProfile(userId));

    // 3. Check XP Transaction Function
    results.push(await this.checkAwardXPFunction(userId));

    // 4. Check Daily Challenge Status
    results.push(await this.checkDailyChallengeStatus(userId));

    // 5. Check Realtime Subscriptions
    results.push(await this.checkRealtimeSubscriptions());

    // 6. Check Level Up Detection
    results.push(await this.checkLevelUpDetection(userId));

    // 7. Check RLS Policies
    results.push(await this.checkRLSPolicies(userId));

    // Log summary
    console.log('\n📊 Health Check Summary:');
    console.log('='.repeat(50));
    results.forEach((r) => {
      const icon = r.status === 'ok' ? '✅' : r.status === 'error' ? '❌' : '⚠️';
      console.log(`${icon} ${r.category}: ${r.message}`);
      if (r.details) {
        console.log('   Details:', JSON.stringify(r.details, null, 2));
      }
    });
    console.log('='.repeat(50));

    return results;
  }

  // 1. Database Connection
  private static async checkDatabaseConnection(): Promise<HealthCheckResult> {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);

      if (error) {
        return {
          category: 'Database Connection',
          status: 'error',
          message: 'Failed to connect to database',
          details: { error: error.message },
        };
      }

      return {
        category: 'Database Connection',
        status: 'ok',
        message: 'Database connection successful',
      };
    } catch (error: any) {
      return {
        category: 'Database Connection',
        status: 'error',
        message: 'Exception connecting to database',
        details: { error: error.message },
      };
    }
  }

  // 2. User Profile Check
  private static async checkUserProfile(userId: string): Promise<HealthCheckResult> {
    try {
      const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

      if (error) {
        return {
          category: 'User Profile',
          status: 'error',
          message: 'Failed to fetch user profile',
          details: { error: error.message },
        };
      }

      if (!profile) {
        return {
          category: 'User Profile',
          status: 'error',
          message: 'User profile not found',
        };
      }

      return {
        category: 'User Profile',
        status: 'ok',
        message: 'Profile exists and accessible',
        details: {
          total_xp: profile.total_xp,
          current_level: profile.current_level,
          level_progress: profile.level_progress,
          subscription_tier: profile.subscription_tier,
        },
      };
    } catch (error: any) {
      return {
        category: 'User Profile',
        status: 'error',
        message: 'Exception fetching profile',
        details: { error: error.message },
      };
    }
  }

  // 3. Test award_xp Function
  private static async checkAwardXPFunction(userId: string): Promise<HealthCheckResult> {
    try {
      // Test with 0 XP (won't actually add XP)
      const { data, error } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: 0,
        p_source_type: 'daily_challenge',
        p_source_id: null,
        p_description: 'Health check test',
        p_habit_id: null,
      });

      if (error) {
        return {
          category: 'award_xp Function',
          status: 'error',
          message: 'award_xp function failed',
          details: {
            error: error.message,
            code: error.code,
            hint: error.hint,
          },
        };
      }

      return {
        category: 'award_xp Function',
        status: 'ok',
        message: 'award_xp function is accessible and working',
      };
    } catch (error: any) {
      return {
        category: 'award_xp Function',
        status: 'error',
        message: 'Exception calling award_xp',
        details: { error: error.message },
      };
    }
  }

  // 4. Daily Challenge Status
  private static async checkDailyChallengeStatus(userId: string): Promise<HealthCheckResult> {
    try {
      const today = getTodayString();

      const { data: challenge, error } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      if (error && error.code !== 'PGRST116') {
        return {
          category: 'Daily Challenge',
          status: 'error',
          message: 'Failed to fetch daily challenge',
          details: { error: error.message },
        };
      }

      if (!challenge) {
        return {
          category: 'Daily Challenge',
          status: 'warning',
          message: 'No daily challenge found for today',
          details: { date: today },
        };
      }

      const isComplete = challenge.completed_tasks === challenge.total_tasks && challenge.total_tasks > 0;
      const canCollect = isComplete && !challenge.xp_collected;

      return {
        category: 'Daily Challenge',
        status: 'ok',
        message: `Challenge exists - ${isComplete ? 'Complete' : 'Incomplete'}, ${canCollect ? 'Can collect' : 'Already collected or not eligible'}`,
        details: {
          total_tasks: challenge.total_tasks,
          completed_tasks: challenge.completed_tasks,
          xp_collected: challenge.xp_collected,
          collected_at: challenge.collected_at,
          is_complete: isComplete,
          can_collect: canCollect,
        },
      };
    } catch (error: any) {
      return {
        category: 'Daily Challenge',
        status: 'error',
        message: 'Exception checking daily challenge',
        details: { error: error.message },
      };
    }
  }

  // 5. Realtime Subscriptions
  private static async checkRealtimeSubscriptions(): Promise<HealthCheckResult> {
    try {
      const channels = supabase.getChannels();

      return {
        category: 'Realtime Subscriptions',
        status: channels.length > 0 ? 'ok' : 'warning',
        message: `${channels.length} active channel(s)`,
        details: {
          channels: channels.map((c) => ({
            topic: c.topic,
            state: c.state,
          })),
        },
      };
    } catch (error: any) {
      return {
        category: 'Realtime Subscriptions',
        status: 'error',
        message: 'Failed to check subscriptions',
        details: { error: error.message },
      };
    }
  }

  // 6. Level Up Detection
  private static async checkLevelUpDetection(userId: string): Promise<HealthCheckResult> {
    try {
      // Get current XP and level
      const { data: profile, error } = await supabase.from('profiles').select('total_xp, current_level, level_progress').eq('id', userId).single();

      if (error) {
        return {
          category: 'Level Up Detection',
          status: 'error',
          message: 'Failed to fetch level data',
          details: { error: error.message },
        };
      }

      // Calculate what level should be based on total_xp
      const { data: calculatedLevel, error: calcError } = await supabase.rpc('calculate_level_from_xp', { total_xp: profile.total_xp });

      if (calcError) {
        return {
          category: 'Level Up Detection',
          status: 'error',
          message: 'Failed to calculate level',
          details: { error: calcError.message },
        };
      }

      const levelMismatch = profile.current_level !== calculatedLevel;

      return {
        category: 'Level Up Detection',
        status: levelMismatch ? 'warning' : 'ok',
        message: levelMismatch ? `Level mismatch detected! Profile: ${profile.current_level}, Calculated: ${calculatedLevel}` : 'Level calculation is correct',
        details: {
          total_xp: profile.total_xp,
          current_level_in_db: profile.current_level,
          calculated_level: calculatedLevel,
          level_progress: profile.level_progress,
        },
      };
    } catch (error: any) {
      return {
        category: 'Level Up Detection',
        status: 'error',
        message: 'Exception checking level',
        details: { error: error.message },
      };
    }
  }

  // 7. RLS Policies Check
  private static async checkRLSPolicies(userId: string): Promise<HealthCheckResult> {
    try {
      // Test read access to own data
      const { data: profile, error: profileError } = await supabase.from('profiles').select('id').eq('id', userId).single();

      // Test read access to xp_transactions
      const { data: transactions, error: transError } = await supabase.from('xp_transactions').select('count').eq('user_id', userId).limit(1);

      // Test read access to daily_challenges
      const today = getTodayString();
      const { data: challenge, error: challengeError } = await supabase.from('daily_challenges').select('id').eq('user_id', userId).eq('date', today).maybeSingle();

      const errors = [
        profileError && { table: 'profiles', error: profileError.message },
        transError && { table: 'xp_transactions', error: transError.message },
        challengeError && challengeError.code !== 'PGRST116' && { table: 'daily_challenges', error: challengeError.message },
      ].filter(Boolean);

      if (errors.length > 0) {
        return {
          category: 'RLS Policies',
          status: 'error',
          message: `RLS policy issues detected on ${errors.length} table(s)`,
          details: { errors },
        };
      }

      return {
        category: 'RLS Policies',
        status: 'ok',
        message: 'All RLS policies allow proper access',
      };
    } catch (error: any) {
      return {
        category: 'RLS Policies',
        status: 'error',
        message: 'Exception checking RLS policies',
        details: { error: error.message },
      };
    }
  }

  // Manual Daily Challenge Collection Test
  static async testDailyChallengeCollection(userId: string): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    console.log('🧪 Testing Daily Challenge Collection');
    console.log('='.repeat(50));

    const today = getTodayString();

    try {
      // 1. Get current challenge
      const { data: challenge, error: fetchError } = await supabase.from('daily_challenges').select('*').eq('user_id', userId).eq('date', today).single();

      console.log('1️⃣ Current Challenge:', challenge);

      if (fetchError || !challenge) {
        return {
          success: false,
          message: 'No daily challenge found',
          details: { error: fetchError?.message },
        };
      }

      // 2. Check if eligible
      const isComplete = challenge.completed_tasks === challenge.total_tasks && challenge.total_tasks > 0;
      const isCollected = challenge.xp_collected;

      console.log('2️⃣ Eligibility:', { isComplete, isCollected });

      if (!isComplete) {
        return {
          success: false,
          message: 'Challenge not complete',
          details: {
            completed: challenge.completed_tasks,
            total: challenge.total_tasks,
          },
        };
      }

      if (isCollected) {
        return {
          success: false,
          message: 'Already collected',
          details: { collected_at: challenge.collected_at },
        };
      }

      // 3. Get XP before
      const { data: profileBefore } = await supabase.from('profiles').select('total_xp, current_level, level_progress').eq('id', userId).single();

      console.log('3️⃣ Profile Before:', profileBefore);

      // 4. Award XP
      const { error: awardError } = await supabase.rpc('award_xp', {
        p_user_id: userId,
        p_amount: 20,
        p_source_type: 'daily_challenge',
        p_source_id: challenge.id,
        p_description: 'Perfect Day - Test Collection',
        p_habit_id: null,
      });

      console.log('4️⃣ Award XP Result:', awardError ? `Error: ${awardError.message}` : 'Success');

      if (awardError) {
        return {
          success: false,
          message: 'Failed to award XP',
          details: {
            error: awardError.message,
            code: awardError.code,
            hint: awardError.hint,
          },
        };
      }

      // 5. Update challenge as collected
      const { error: updateError } = await supabase
        .from('daily_challenges')
        .update({
          xp_collected: true,
          collected_at: new Date().toISOString(),
        })
        .eq('id', challenge.id);

      console.log('5️⃣ Update Challenge Result:', updateError ? `Error: ${updateError.message}` : 'Success');

      if (updateError) {
        return {
          success: false,
          message: 'XP awarded but failed to mark as collected',
          details: { error: updateError.message },
        };
      }

      // 6. Get XP after
      const { data: profileAfter } = await supabase.from('profiles').select('total_xp, current_level, level_progress').eq('id', userId).single();

      console.log('6️⃣ Profile After:', profileAfter);

      // 7. Verify XP transaction was created
      const { data: transaction } = await supabase
        .from('xp_transactions')
        .select('*')
        .eq('user_id', userId)
        .eq('source_type', 'daily_challenge')
        .eq('source_id', challenge.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      console.log('7️⃣ XP Transaction:', transaction);

      const xpGained = (profileAfter?.total_xp || 0) - (profileBefore?.total_xp || 0);

      console.log('='.repeat(50));

      return {
        success: true,
        message: `Successfully collected! Gained ${xpGained} XP`,
        details: {
          before: profileBefore,
          after: profileAfter,
          xp_gained: xpGained,
          transaction_created: !!transaction,
          transaction_id: transaction?.id,
        },
      };
    } catch (error: any) {
      console.error('❌ Test Exception:', error);
      return {
        success: false,
        message: 'Exception during test',
        details: { error: error.message },
      };
    }
  }
}

// Usage in a component or debug screen:
// import { HealthCheckService } from '@/utils/healthCheck';
//
// const runHealthCheck = async () => {
//   const userId = user?.id;
//   if (!userId) return;
//
//   await HealthCheckService.runFullDiagnostic(userId);
// };
//
// const testCollection = async () => {
//   const userId = user?.id;
//   if (!userId) return;
//
//   const result = await HealthCheckService.testDailyChallengeCollection(userId);
//   console.log('Test Result:', result);
// };
