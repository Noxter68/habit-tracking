/**
 * Supabase Edge Function: decode-attribution
 *
 * Receives an Apple AdServices attribution token from the app,
 * sends it to Apple's Attribution API to decode it,
 * and returns the campaign token (e.g. 'leo').
 *
 * Apple Attribution API docs:
 * https://developer.apple.com/documentation/adservices/aattribution
 */

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const APPLE_ATTRIBUTION_URL = 'https://api-adservices.apple.com/api/v1/';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { token, user_id } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Missing attribution token' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 1. Decode token via Apple Attribution API
    // =========================================================================
    const appleResponse = await fetch(APPLE_ATTRIBUTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: token,
    });

    if (!appleResponse.ok) {
      const errorText = await appleResponse.text();
      console.error('Apple API error:', appleResponse.status, errorText);

      // Apple returns 200 even for organic installs
      // Non-200 means the token is invalid or expired
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Apple attribution API error',
          status: appleResponse.status,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const attribution = await appleResponse.json();
    console.log('Apple attribution response:', JSON.stringify(attribution));

    // =========================================================================
    // 2. Extract campaign token
    // =========================================================================
    // Apple response includes: attribution, orgId, campaignId, conversionType,
    // clickDate, adGroupId, countryOrRegion, keywordId, creativeSetId, campaignName
    //
    // The 'ct' parameter from the App Store URL ends up in campaignId or
    // can be found in the campaign name. For custom campaign tokens,
    // Apple puts the ct= value in the response.

    const campaignToken = attribution.campaignToken  // Custom campaign token (ct=)
      || attribution.campaignName                     // Campaign name fallback
      || null;

    const isOrganic = attribution.attribution === false;

    if (!campaignToken || isOrganic) {
      return new Response(
        JSON.stringify({
          success: true,
          organic: true,
          campaign_token: null,
          attribution,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // =========================================================================
    // 3. Save attribution to database
    // =========================================================================
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase.rpc('save_referral_attribution', {
      p_user_id: user_id,
      p_campaign_token: campaignToken,
      p_attribution_source: 'apple_ads',
      p_raw_attribution: attribution,
    });

    if (error) {
      console.error('Supabase RPC error:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        organic: false,
        campaign_token: campaignToken,
        attribution,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
