import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronUp } from "lucide-react";

interface BundleCardProps {
  id: string;
  capacity: string;
  price: number;
  network: "yello" | "telecel" | "airteltigo";
  validity?: string;
}

export default function BundleCard({ id, capacity, price, network, validity = "30 days" }: BundleCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCardClick = () => {
    setIsExpanded(!isExpanded);
  };

  const handlePurchase = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!phoneNumber.trim()) {
      alert("Please enter a valid phone number");
      return;
    }
    
    setIsProcessing(true);
    // TODO: Integrate with DataMart API for purchase
    setTimeout(() => {
      alert(`Purchase request sent for ${phoneNumber}!`);
      setIsProcessing(false);
      setIsExpanded(false);
      setPhoneNumber("");
    }, 2000);
  };

  const networkStyles = {
    yello: {
      gradient: "bg-gradient-to-br from-yello to-yello/80",
      button: "bg-yello hover:bg-yello/90 text-yello-foreground",
      shadow: "shadow-lg hover:shadow-yello/25",
      border: "border-yello/20"
    },
    telecel: {
      gradient: "bg-gradient-to-br from-telecel to-telecel/80",
      button: "bg-telecel hover:bg-telecel/90 text-telecel-foreground",
      shadow: "shadow-lg hover:shadow-telecel/25",
      border: "border-telecel/20"
    },
    airteltigo: {
      gradient: "bg-gradient-to-br from-airteltigo to-airteltigo/80",
      button: "bg-airteltigo hover:bg-airteltigo/90 text-airteltigo-foreground",
      shadow: "shadow-lg hover:shadow-airteltigo/25",
      border: "border-airteltigo/20"
    }
  };

  const style = networkStyles[network];

  return (
    <Card 
      className={`cursor-pointer transition-all duration-300 ${style.shadow} hover:scale-105 border-2 ${style.border} bg-card/50 backdrop-blur-sm`}
      onClick={handleCardClick}
    >
      <CardHeader className={`${style.gradient} text-white rounded-t-lg`}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-lg font-bold">{capacity}</CardTitle>
            <CardDescription className="text-white/90 font-medium">
              Valid for {validity}
            </CardDescription>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₵{price}</div>
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={`transition-all duration-300 overflow-hidden ${isExpanded ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 bg-card border-t-2 border-dashed border-muted z-50 relative bg-background">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Receiver Phone Number
                </label>
                <Input
                  type="tel"
                  placeholder="e.g., 0241234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="mt-1"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <Button 
                className={`w-full ${style.button} font-semibold`}
                onClick={handlePurchase}
                disabled={isProcessing || !phoneNumber.trim()}
              >
                {isProcessing ? "Processing..." : `Buy ${capacity} for ₵${price}`}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}