import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  User, 
  Package, 
  Settings, 
  LogOut, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  Edit,
  CheckCircle,
  Clock,
  Truck,
  ShoppingBag,
  CreditCard,
  Eye,
  Download,
  X
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import UserStatsCard from "@/components/user/UserStatsCard";
import RecentOrderCard from "@/components/user/RecentOrderCard";
import AddressManager from "@/components/user/AddressManager";

const Account = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    country: "",
    postal_code: "",
  });

  useEffect(() => {
    fetchUserData();
  }, [user]);

  // Handle tab selection from URL parameters
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['profile', 'orders', 'addresses', 'settings'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchUserData = async () => {
    try {
      if (!user) return;

      // Fetch profile using our new API
      const profileData = await api.get('/auth/profile');
      setProfile(profileData);
      setFormData({
        first_name: profileData.first_name || "",
        last_name: profileData.last_name || "",
        phone: profileData.phone || "",
        address: profileData.address || "",
        city: profileData.city || "",
        state: profileData.state || "",
        country: profileData.country || "",
        postal_code: profileData.postal_code || "",
      });

      // Fetch recent orders using our new API
      const ordersData = await api.get('/orders?limit=5&sort_by=created_at&sort_order=desc');
      setOrders(ordersData.orders || []);

    } catch (error) {
      console.error("Error fetching user data:", error);
      toast({
        title: "Error",
        description: "Failed to load account data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    setUpdating(true);

    try {
      await api.put('/auth/profile', formData);

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
      
      // Refresh profile data
      await fetchUserData();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to logout",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      processing: "bg-blue-100 text-blue-800 border-blue-200",
      shipped: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200"
    };
    return colors[status] || colors.pending;
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'processing': return <Package className="h-3 w-3" />;
      case 'shipped': return <Truck className="h-3 w-3" />;
      case 'delivered': return <CheckCircle className="h-3 w-3" />;
      case 'cancelled': return <X className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-20 pb-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="h-8 w-8 animate-spin text-gray-600" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen pt-20 pb-10 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-6xl mx-auto"
        >
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={`https://api.dicebear.com/7.x/initials/svg?seed=${profile?.first_name || user?.email}`} 
                    alt={`${profile?.first_name} ${profile?.last_name}`} 
                  />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
                    {profile?.first_name ? 
                      `${profile.first_name[0]}${profile.last_name?.[0] || ''}` : 
                      user?.email?.substring(0, 2).toUpperCase() || 'U'
                    }
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {profile?.first_name && profile?.last_name 
                      ? `${profile.first_name} ${profile.last_name}`
                      : "Welcome to your account"
                    }
                  </h1>
                  <p className="text-gray-600 flex items-center mt-1">
                    <Mail className="h-4 w-4 mr-2" />
                    {user?.email}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <UserStatsCard
                title="Total Orders"
                value={orders.length}
                icon={ShoppingBag}
                gradientFrom="blue-50"
                gradientTo="blue-100"
                textColor="text-blue-600"
                iconColor="text-blue-500"
                loading={loading}
              />
              
              <UserStatsCard
                title="Total Spent"
                value={`$${orders.reduce((sum, order) => sum + (order.total_amount || 0), 0).toFixed(2)}`}
                icon={CreditCard}
                gradientFrom="green-50"
                gradientTo="green-100"
                textColor="text-green-600"
                iconColor="text-green-500"
                loading={loading}
              />
              
              <UserStatsCard
                title="Member Since"
                value={new Date(profile?.created_at || user?.created_at).getFullYear()}
                icon={Calendar}
                gradientFrom="purple-50"
                gradientTo="purple-100"
                textColor="text-purple-600"
                iconColor="text-purple-500"
                loading={loading}
              />
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => {
            setActiveTab(value);
            // Update URL without page reload
            navigate(`/account?tab=${value}`, { replace: true });
          }} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 bg-white shadow-sm border">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="h-4 w-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center space-x-2">
                <Package className="h-4 w-4" />
                <span>Orders</span>
              </TabsTrigger>
              <TabsTrigger value="addresses" className="flex items-center space-x-2">
                <MapPin className="h-4 w-4" />
                <span>Addresses</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <Edit className="h-5 w-5" />
                    <span>Personal Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="first_name" className="text-sm font-medium text-gray-700">
                          First Name
                        </Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) =>
                            setFormData({ ...formData, first_name: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your first name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="last_name" className="text-sm font-medium text-gray-700">
                          Last Name
                        </Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) =>
                            setFormData({ ...formData, last_name: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your last name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Phone Number
                      </Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          className="pl-10"
                          placeholder="Enter your phone number"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                        Address
                      </Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) =>
                            setFormData({ ...formData, address: e.target.value })
                          }
                          className="pl-10"
                          placeholder="Enter your address"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) =>
                            setFormData({ ...formData, city: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                          State/Province
                        </Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) =>
                            setFormData({ ...formData, state: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your state/province"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                          Country
                        </Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) =>
                            setFormData({ ...formData, country: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your country"
                        />
                      </div>
                      <div>
                        <Label htmlFor="postal_code" className="text-sm font-medium text-gray-700">
                          Postal Code
                        </Label>
                        <Input
                          id="postal_code"
                          value={formData.postal_code}
                          onChange={(e) =>
                            setFormData({ ...formData, postal_code: e.target.value })
                          }
                          className="mt-1"
                          placeholder="Enter your postal code"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                      disabled={updating}
                    >
                      {updating ? (
                        <div className="flex items-center justify-center">
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Updating Profile...
                        </div>
                      ) : (
                        <div className="flex items-center justify-center">
                          <Edit className="w-4 h-4 mr-2" />
                          Update Profile
                        </div>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <Package className="h-5 w-5" />
                      <span>Order History</span>
                    </CardTitle>
                    {orders.length > 5 && (
                      <Badge variant="secondary" className="text-xs">
                        Showing latest 5 orders
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
                      <p className="text-gray-500 mb-6">
                        You haven't placed any orders yet. Start shopping to see your orders here.
                      </p>
                      <Button
                        onClick={() => navigate('/shop')}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        Start Shopping
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <RecentOrderCard
                          key={order.id}
                          order={order}
                          onClick={() => navigate(`/order/${order.order_number}`)}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Manage Addresses</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <AddressManager userId={user?.id} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <Card className="border-0 shadow-sm">
                <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Account Settings</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    {/* Account Information */}
                    <div className="border-b pb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Email Address</p>
                            <p className="text-sm text-gray-600">{user?.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Calendar className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-700">Member Since</p>
                            <p className="text-sm text-gray-600">
                              {new Date(profile?.created_at || user?.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Button
                          variant="outline"
                          onClick={() => setActiveTab('orders')}
                          className="justify-start h-auto p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <Package className="h-5 w-5 text-blue-500" />
                            <div className="text-left">
                              <p className="font-medium">View All Orders</p>
                              <p className="text-sm text-gray-500">Track your order history</p>
                            </div>
                          </div>
                        </Button>
                        
                        <Button
                          variant="outline"
                          onClick={() => navigate('/shop')}
                          className="justify-start h-auto p-4"
                        >
                          <div className="flex items-center space-x-3">
                            <ShoppingBag className="h-5 w-5 text-green-500" />
                            <div className="text-left">
                              <p className="font-medium">Continue Shopping</p>
                              <p className="text-sm text-gray-500">Browse our latest collections</p>
                            </div>
                          </div>
                        </Button>
                      </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium text-red-600 mb-4">Danger Zone</h3>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-red-800">Logout from Account</p>
                            <p className="text-sm text-red-600">
                              Sign out of your account on this device
                            </p>
                          </div>
                          <Button
                            onClick={handleLogout}
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <LogOut className="h-4 w-4 mr-2" />
                            Logout
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Account;
