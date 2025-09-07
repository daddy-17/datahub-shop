import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Network mapping from our system to DataMart API
const NETWORK_MAPPING: Record<string, string> = {
  "yello": "YELLO",
  "telecel": "TELECEL", 
  "airteltigo": "AT_PREMIUM",
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

    // Get DataMart API network name
    const datamartNetwork = NETWORK_MAPPING[bundle.network.toLowerCase()];
    if (!datamartNetwork) {
      throw new Error(`Unsupported network: ${bundle.network}`);
    }

    // Extract capacity number from bundle capacity (e.g., "5GB" -> "5")
    const capacityMatch = bundle.capacity.match(/(\d+)/);
    const capacity = capacityMatch ? capacityMatch[1] : bundle.capacity;

    console.log(`Purchasing data bundle via DataMart API:`, {
      network: datamartNetwork,
      capacity: capacity,
      receiverPhone,
      amount: bundle.price,
    });

    // Purchase data bundle via DataMart API
    const datamartResponse = await fetch("https://api.datamartgh.shop/api/developer/purchase", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("DATAMART_API_KEY") ?? "",
      },
      body: JSON.stringify({
        phoneNumber: receiverPhone,
        network: datamartNetwork,
        capacity: capacity,
        gateway: "wallet",
      }),
    });

    const datamartData = await datamartResponse.json();

    if (!datamartResponse.ok || datamartData.status !== "success") {
      console.error("DataMart API Error:", datamartData);
      
      // Update order status to failed
      await supabaseService
        .from("orders")
        .update({ 
          status: "failed",
          transaction_id: `FAILED_${Date.now()}`,
        })
        .eq("id", order.id);

      // Refund user wallet
      await supabaseService.rpc("update_wallet_balance", {
        p_user_id: user.id,
        p_amount: bundle.price,
        p_type: "credit",
        p_description: `Refund: Failed purchase - ${bundle.capacity} ${bundle.network} data bundle`,
        p_reference: `REFUND_${order.id}`,
      });

      throw new Error(datamartData.message || "Data bundle purchase failed");
    }

    // Update order status to completed with DataMart transaction details
    const { error: updateError } = await supabaseService
      .from("orders")
      .update({ 
        status: "completed",
        transaction_id: datamartData.data.transactionReference || datamartData.data.purchaseId,
      })
      .eq("id", order.id);

    if (updateError) {
      console.error("Failed to update order status:", updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        transactionReference: datamartData.data.transactionReference,
        purchaseId: datamartData.data.purchaseId,
        message: "Data bundle purchased successfully",
        datamartResponse: datamartData.data,
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