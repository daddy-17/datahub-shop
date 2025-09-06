import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import { toast } from "@/hooks/use-toast";
import { Users, Package, TrendingUp, DollarSign, Plus, Edit } from "lucide-react";

interface Profile {
  is_admin: boolean;
}

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  activeOrders: number;
}

interface DataBundle {
  id: string;
  network: string;
  capacity: string;
  price: number;
  validity: string;
  is_active: boolean;
}

interface Order {
  id: string;
  receiver_phone: string;
  amount: number;
  status: string;
  created_at: string;
  user_id: string;
  data_bundles: {
    capacity: string;
    network: string;
  };
}

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
  });
  const [bundles, setBundles] = useState<DataBundle[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [newBundle, setNewBundle] = useState({
    network: "",
    capacity: "",
    price: "",
    validity: "30 days",
  });
  const [editingBundle, setEditingBundle] = useState<DataBundle | null>(null);

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
    checkAdminAccess();
  }, [user]);

  useEffect(() => {
    if (profile?.is_admin) {
      fetchStats();
      fetchBundles();
      fetchOrders();
    }
  }, [profile]);

  const checkAdminAccess = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      
      if (!data.is_admin) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges",
          variant: "destructive",
        });
        navigate("/");
        return;
      }
      
      setProfile(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to verify admin access",
        variant: "destructive",
      });
      navigate("/");
    }
  };

  const fetchStats = async () => {
    try {
      // Get total users
      const { count: totalUsers } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Get total orders
      const { count: totalOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true });

      // Get total revenue
      const { data: revenueData } = await supabase
        .from("orders")
        .select("amount")
        .eq("status", "completed");

      const totalRevenue = revenueData?.reduce((sum, order) => sum + parseFloat(order.amount.toString()), 0) || 0;

      // Get active orders
      const { count: activeOrders } = await supabase
        .from("orders")
        .select("*", { count: "exact", head: true })
        .in("status", ["pending", "processing"]);

      setStats({
        totalUsers: totalUsers || 0,
        totalOrders: totalOrders || 0,
        totalRevenue,
        activeOrders: activeOrders || 0,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    }
  };

  const fetchBundles = async () => {
    try {
      const { data, error } = await supabase
        .from("data_bundles")
        .select("*")
        .order("network")
        .order("price");

      if (error) throw error;
      setBundles(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load bundles",
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
        .order("created_at", { ascending: false })
        .limit(50);

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

  const handleCreateBundle = async () => {
    if (!newBundle.network || !newBundle.capacity || !newBundle.price) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("data_bundles")
        .insert({
          network: newBundle.network,
          capacity: newBundle.capacity,
          price: parseFloat(newBundle.price),
          validity: newBundle.validity,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bundle created successfully",
      });

      setNewBundle({ network: "", capacity: "", price: "", validity: "30 days" });
      fetchBundles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to create bundle",
        variant: "destructive",
      });
    }
  };

  const handleUpdateBundleStatus = async (bundleId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("data_bundles")
        .update({ is_active: isActive })
        .eq("id", bundleId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Bundle ${isActive ? "activated" : "deactivated"}`,
      });

      fetchBundles();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update bundle",
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

  if (!profile?.is_admin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage your DataHub platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₵{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeOrders}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="bundles" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bundles">Data Bundles</TabsTrigger>
            <TabsTrigger value="orders">Orders</TabsTrigger>
          </TabsList>

          <TabsContent value="bundles" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Bundle Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus size={20} />
                    Create New Bundle
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="network">Network</Label>
                    <Select value={newBundle.network} onValueChange={(value) => setNewBundle({...newBundle, network: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="yello">Yello</SelectItem>
                        <SelectItem value="telecel">Telecel</SelectItem>
                        <SelectItem value="airteltigo">AirtelTigo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      placeholder="e.g., 5GB"
                      value={newBundle.capacity}
                      onChange={(e) => setNewBundle({...newBundle, capacity: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price">Price (₵)</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newBundle.price}
                      onChange={(e) => setNewBundle({...newBundle, price: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="validity">Validity</Label>
                    <Input
                      id="validity"
                      placeholder="e.g., 30 days"
                      value={newBundle.validity}
                      onChange={(e) => setNewBundle({...newBundle, validity: e.target.value})}
                    />
                  </div>
                  <Button onClick={handleCreateBundle} className="w-full">
                    Create Bundle
                  </Button>
                </CardContent>
              </Card>

              {/* Bundles List */}
              <Card>
                <CardHeader>
                  <CardTitle>Existing Bundles</CardTitle>
                  <CardDescription>Manage your data bundle offerings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {bundles.map((bundle) => (
                      <div key={bundle.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {bundle.capacity} - {bundle.network}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            ₵{bundle.price} • {bundle.validity}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={bundle.is_active ? "default" : "secondary"}>
                            {bundle.is_active ? "Active" : "Inactive"}
                          </Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateBundleStatus(bundle.id, !bundle.is_active)}
                          >
                            {bundle.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>All Orders</CardTitle>
                <CardDescription>Monitor all platform orders</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}