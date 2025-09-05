import BundleCard from "@/components/BundleCard";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

// Mock data for Yello bundles
const yelloBundles = [
  { id: "1", capacity: "1GB", price: 5, network: "yello" as const, validity: "7 days" },
  { id: "2", capacity: "2GB", price: 9, network: "yello" as const, validity: "14 days" },
  { id: "3", capacity: "5GB", price: 20, network: "yello" as const, validity: "30 days" },
  { id: "4", capacity: "10GB", price: 35, network: "yello" as const, validity: "30 days" },
  { id: "5", capacity: "20GB", price: 60, network: "yello" as const, validity: "30 days" },
  { id: "6", capacity: "50GB", price: 120, network: "yello" as const, validity: "30 days" },
];

export default function YelloPage() {
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {yelloBundles.map((bundle) => (
            <BundleCard
              key={bundle.id}
              id={bundle.id}
              capacity={bundle.capacity}
              price={bundle.price}
              network={bundle.network}
              validity={bundle.validity}
            />
          ))}
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