import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Zap, Shield, Clock } from "lucide-react";
import Navbar from "@/components/Navbar";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-yello-secondary/20 to-telecel-secondary/20">
      <Navbar />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-yello via-telecel to-airteltigo bg-clip-text text-transparent">
              DataHub Ghana
            </span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your trusted platform for instant mobile data purchases. Buy data bundles for all major networks in Ghana with ease.
          </p>
          
          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="bg-card/50 backdrop-blur-sm border-yello/20">
              <CardHeader>
                <Zap className="h-8 w-8 text-yello mx-auto mb-2" />
                <CardTitle className="text-yello">Instant Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Get your data bundles delivered instantly to any phone number
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-telecel/20">
              <CardHeader>
                <Shield className="h-8 w-8 text-telecel mx-auto mb-2" />
                <CardTitle className="text-telecel">Secure & Reliable</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Bank-level security with 99.9% uptime guarantee
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card className="bg-card/50 backdrop-blur-sm border-airteltigo/20">
              <CardHeader>
                <Clock className="h-8 w-8 text-airteltigo mx-auto mb-2" />
                <CardTitle className="text-airteltigo">24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Round-the-clock customer support for all your needs
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Network Selection */}
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* Yello Card */}
          <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-yello-secondary to-background border-2 border-yello/20 hover:border-yello/40 shadow-lg hover:shadow-yello/25">
            <Link to="/yello">
              <CardHeader className="bg-gradient-to-r from-yello to-yello/80 text-white">
                <div className="flex items-center justify-center mb-4">
                  <Smartphone className="h-12 w-12" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Yello</CardTitle>
                <CardDescription className="text-white/90 text-center">
                  Fast & Reliable Data Bundles
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-yello mb-2">₵5 - ₵120</div>
                  <p className="text-sm text-muted-foreground">Starting from 1GB</p>
                </div>
                <Button className="w-full bg-yello hover:bg-yello/90 text-yello-foreground font-semibold">
                  Browse Yello Bundles
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* Telecel Card */}
          <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-telecel-secondary to-background border-2 border-telecel/20 hover:border-telecel/40 shadow-lg hover:shadow-telecel/25">
            <Link to="/telecel">
              <CardHeader className="bg-gradient-to-r from-telecel to-telecel/80 text-white">
                <div className="flex items-center justify-center mb-4">
                  <Smartphone className="h-12 w-12" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">Telecel</CardTitle>
                <CardDescription className="text-white/90 text-center">
                  Premium Data Solutions
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-telecel mb-2">₵6 - ₵130</div>
                  <p className="text-sm text-muted-foreground">Starting from 1GB</p>
                </div>
                <Button className="w-full bg-telecel hover:bg-telecel/90 text-telecel-foreground font-semibold">
                  Browse Telecel Bundles
                </Button>
              </CardContent>
            </Link>
          </Card>

          {/* AirtelTigo Card */}
          <Card className="group hover:scale-105 transition-all duration-300 cursor-pointer bg-gradient-to-br from-airteltigo-secondary to-background border-2 border-airteltigo/20 hover:border-airteltigo/40 shadow-lg hover:shadow-airteltigo/25">
            <Link to="/airteltigo">
              <CardHeader className="bg-gradient-to-r from-airteltigo to-airteltigo/80 text-white">
                <div className="flex items-center justify-center mb-4">
                  <Smartphone className="h-12 w-12" />
                </div>
                <CardTitle className="text-2xl font-bold text-center">AirtelTigo</CardTitle>
                <CardDescription className="text-white/90 text-center">
                  Affordable Data Packages
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-airteltigo mb-2">₵5.5 - ₵125</div>
                  <p className="text-sm text-muted-foreground">Starting from 1GB</p>
                </div>
                <Button className="w-full bg-airteltigo hover:bg-airteltigo/90 text-airteltigo-foreground font-semibold">
                  Browse AirtelTigo Bundles
                </Button>
              </CardContent>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
