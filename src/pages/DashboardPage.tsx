import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { Wallet, History, CreditCard, Plus, ArrowUpDown } from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  phone_number: string;
  wallet_balance: number;
  is_admin: boolean;
}

interface Order {
  id: string;
  receiver_phone: string;
  amount: number;
  status: string;
  created_at: string;
  data_bundles: {
    capacity: string;
    network: string;
  };
}

interface WalletTransaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [isTopUpLoading, setIsTopUpLoading] = useState(false);

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
      <div className="text-center">Loading...</div>
    </div>;
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  useEffect(() => {
    fetchProfile();
    fetchOrders();
    fetchTransactions();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from("orders")
        .select(`
          *,
          data_bundles (
            capacity,
            network
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setOrders(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive",
      });
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
    }
  };

  const handleTopUp = async () => {
    if (!topUpAmount || parseFloat(topUpAmount) <= 0) {
      toast({
        title: "Error",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsTopUpLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("paystack-topup", {
        body: {
          amount: parseFloat(topUpAmount),
          email: user.email,
        },
      });

      if (error) throw error;

      if (data?.success && data?.data?.authorization_url) {
        // Open Paystack payment page in new tab
        window.open(data.data.authorization_url, '_blank');
        
        toast({
          title: "Payment Initiated",
          description: "Complete your payment in the new tab. Check back here after payment.",
        });

        setTopUpAmount("");
      } else {
        throw new Error(data?.error || "Failed to initialize payment");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to initialize payment",
        variant: "destructive",
      });
    } finally {
      setIsTopUpLoading(false);
    }
  };

  // Add payment verification function
  const verifyPayment = async (reference: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("paystack-verify", {
        body: { reference },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: "Payment Successful",
          description: `₵${data.amount} added to your wallet`,
        });
        fetchProfile();
        fetchTransactions();
      } else {
        throw new Error(data?.error || "Payment verification failed");
      }
    } catch (error: any) {
      toast({
        title: "Payment Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "outline",
      processing: "secondary",
      completed: "default",
      failed: "destructive",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name}!</h1>
          <p className="text-muted-foreground">Manage your wallet and view your data bundle orders</p>
        </div>

        {/* Wallet Balance Card */}
        <Card className="mb-8 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet size={24} />
              Wallet Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-4">
              ₵{profile?.wallet_balance?.toFixed(2) || "0.00"}
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Enter amount"
                  value={topUpAmount}
                  onChange={(e) => setTopUpAmount(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/70"
                />
              </div>
              <Button
                onClick={handleTopUp}
                disabled={isTopUpLoading}
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white border-white/20"
              >
                <Plus size={16} className="mr-2" />
                {isTopUpLoading ? "Adding..." : "Top Up"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <History size={16} />
              Recent Orders
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <ArrowUpDown size={16} />
              Transactions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Data Bundle Orders</CardTitle>
                <CardDescription>
                  Your recent data bundle purchases and their status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {orders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No orders yet. Start by purchasing a data bundle!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {order.data_bundles?.capacity} - {order.data_bundles?.network}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            To: {order.receiver_phone}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(order.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">₵{order.amount}</div>
                          {getStatusBadge(order.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="transactions" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Wallet Transactions</CardTitle>
                <CardDescription>
                  All your wallet activity and transaction history
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No transactions yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{transaction.description}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <div className={`font-medium ${
                          transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.type === 'credit' ? '+' : '-'}₵{transaction.amount}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}