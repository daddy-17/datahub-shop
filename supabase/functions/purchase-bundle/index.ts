import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const { bundleId, receiverPhone } = await req.json();

    if (!bundleId || !receiverPhone) {
      throw new Error("Bundle ID and receiver phone are required");
    }

    // Get bundle details
    const { data: bundle, error: bundleError } = await supabaseClient
      .from("data_bundles")
      .select("*")
      .eq("id", bundleId)
      .eq("is_active", true)
      .single();

    if (bundleError || !bundle) {
      throw new Error("Bundle not found or inactive");
    }

    // Get user profile and wallet balance
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("wallet_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      throw new Error("User profile not found");
    }

    // Check if user has sufficient balance
    if (profile.wallet_balance < bundle.price) {
      throw new Error("Insufficient wallet balance");
    }

    // Use service role to perform database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Create order
    const { data: order, error: orderError } = await supabaseService
      .from("orders")
      .insert({
        user_id: user.id,
        bundle_id: bundleId,
        receiver_phone: receiverPhone,
        amount: bundle.price,
        status: "pending",
      })
      .select()
      .single();

    if (orderError) {
      throw new Error("Failed to create order");
    }

    // Deduct amount from wallet
    const { error: walletError } = await supabaseService.rpc("update_wallet_balance", {
      p_user_id: user.id,
      p_amount: bundle.price,
      p_type: "debit",
      p_description: `Purchase: ${bundle.capacity} ${bundle.network} data bundle`,
      p_reference: order.id,
    });

    if (walletError) {
      // Rollback order if wallet deduction fails
      await supabaseService
        .from("orders")
        .delete()
        .eq("id", order.id);
      
      throw new Error("Failed to process payment");
    }

    // TODO: Integrate with DataMart API to actually purchase the bundle
    // For now, we'll simulate API call and update order status
    
    console.log(`Processing data bundle purchase:`, {
      network: bundle.network,
      capacity: bundle.capacity,
      receiverPhone,
      amount: bundle.price,
    });

    // Simulate API processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Update order status to processing (in real implementation, this would be done after successful API call)
    const { error: updateError } = await supabaseService
      .from("orders")
      .update({ 
        status: "processing",
        transaction_id: `TXN_${Date.now()}`,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        message: "Bundle purchase initiated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Purchase bundle error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      }
    );
  }
});