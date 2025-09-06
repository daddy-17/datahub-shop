import { useState, useEffect } from "react";
import BundleCard from "@/components/BundleCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

interface Bundle {
  id: string;
  capacity: string;
  price: number;
  network: "yello" | "telecel" | "airteltigo";
  validity: string;
}

export default function YelloPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("data_bundles")
        .select("*")
        .eq("network", "yello")
        .eq("is_active", true)
        .order("price");

      if (error) throw error;
      setBundles(data?.map(bundle => ({
        ...bundle,
        network: bundle.network as "yello" | "telecel" | "airteltigo"
      })) || []);
    } catch (error) {
      console.error("Error fetching bundles:", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-yello-secondary to-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <Card className="bg-gradient-to-r from-yello to-yello/80 text-white border-none shadow-2xl">
            <CardHeader className="pb-8">
              <CardTitle className="text-4xl font-bold mb-2">
                Yello Data Bundles
              </CardTitle>
              <CardDescription className="text-white/90 text-lg">
                Fast, reliable data bundles for your Yello line
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Bundle Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="text-lg">Loading bundles...</div>
            </div>
          ) : bundles.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <div className="text-lg">No bundles available</div>
            </div>
          ) : (
            bundles.map((bundle) => (
              <BundleCard
                key={bundle.id}
                id={bundle.id}
                capacity={bundle.capacity}
                price={bundle.price}
                network={bundle.network}
                validity={bundle.validity}
              />
            ))
          )}
        </div>

        {/* Info Section */}
        <div className="mt-12">
          <Card className="bg-card/50 backdrop-blur-sm border-yello/20">
            <CardHeader>
              <CardTitle className="text-yello">How it works</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <div className="bg-yello/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yello font-bold">1</span>
                </div>
                <p>Select your preferred data bundle</p>
              </div>
              <div className="text-center">
                <div className="bg-yello/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yello font-bold">2</span>
                </div>
                <p>Enter the recipient phone number</p>
              </div>
              <div className="text-center">
                <div className="bg-yello/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-yello font-bold">3</span>
                </div>
                <p>Complete your purchase securely</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}