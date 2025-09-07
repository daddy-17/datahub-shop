import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Network mapping from DataMart API to our system
const NETWORK_MAPPING: Record<string, string> = {
  "YELLO": "yello",
  "TELECEL": "telecel", 
  "AT_PREMIUM": "airteltigo",
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

    // Check if user is admin
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile?.is_admin) {
      throw new Error("Admin access required");
    }

    // Use service role for database operations
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Fetching data packages from DataMart API...");

    // Fetch data packages from DataMart API
    const datamartResponse = await fetch("https://api.datamartgh.shop/api/developer/data-packages", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": Deno.env.get("DATAMART_API_KEY") ?? "",
      },
    });

    if (!datamartResponse.ok) {
      throw new Error("Failed to fetch data packages from DataMart API");
    }

    const datamartData = await datamartResponse.json();

    if (datamartData.status !== "success") {
      throw new Error(datamartData.message || "Failed to fetch data packages");
    }

    const packagesData = datamartData.data;
    let syncedCount = 0;
    let updatedCount = 0;

    console.log("Processing packages for each network...");

    // Process packages for each network
    for (const [datamartNetwork, packages] of Object.entries(packagesData)) {
      const ourNetwork = NETWORK_MAPPING[datamartNetwork as string];
      
      if (!ourNetwork) {
        console.log(`Skipping unknown network: ${datamartNetwork}`);
        continue;
      }

      console.log(`Processing ${packages.length} packages for ${ourNetwork}`);

      // Process each package
      for (const pkg of packages as any[]) {
        const capacity = `${pkg.capacity}GB`;
        const price = parseFloat(pkg.price);

        // Check if package already exists
        const { data: existingBundle, error: searchError } = await supabaseService
          .from("data_bundles")
          .select("id, price")
          .eq("network", ourNetwork)
          .eq("capacity", capacity)
          .maybeSingle();

        if (searchError) {
          console.error(`Error searching for bundle: ${searchError.message}`);
          continue;
        }

        if (existingBundle) {
          // Update existing bundle if price changed
          if (existingBundle.price !== price) {
            const { error: updateError } = await supabaseService
              .from("data_bundles")
              .update({ 
                price: price,
                is_active: true,
              })
              .eq("id", existingBundle.id);

            if (updateError) {
              console.error(`Error updating bundle: ${updateError.message}`);
            } else {
              updatedCount++;
              console.log(`Updated ${ourNetwork} ${capacity} - Price: ₵${price}`);
            }
          }
        } else {
          // Create new bundle
          const { error: insertError } = await supabaseService
            .from("data_bundles")
            .insert({
              network: ourNetwork,
              capacity: capacity,
              price: price,
              validity: "30 days", // Default validity
              is_active: true,
            });

          if (insertError) {
            console.error(`Error inserting bundle: ${insertError.message}`);
          } else {
            syncedCount++;
            console.log(`Created ${ourNetwork} ${capacity} - Price: ₵${price}`);
          }
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Data packages synced successfully",
        synced: syncedCount,
        updated: updatedCount,
        total: syncedCount + updatedCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Sync packages error:", error);
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