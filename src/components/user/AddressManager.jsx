import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  MapPin, 
  Plus, 
  Edit, 
  Trash2, 
  Star, 
  Check,
  X,
  Home,
  Building,
  Users
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

const AddressCard = ({ 
  address, 
  isDefault, 
  onEdit, 
  onDelete, 
  onSetDefault, 
  showActions = true 
}) => {
  const getAddressTypeIcon = (type) => {
    switch(type) {
      case 'home': return <Home className="h-4 w-4" />;
      case 'work': return <Building className="h-4 w-4" />;
      case 'other': return <MapPin className="h-4 w-4" />;
      default: return <MapPin className="h-4 w-4" />;
    }
  };

  const formatAddress = (addr) => {
    const parts = [
      addr.address,
      addr.city,
      addr.state,
      addr.postal_code,
      addr.country
    ].filter(Boolean);
    return parts.join(', ');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={`border-2 transition-all ${
        isDefault 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-200 hover:border-gray-300'
      }`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {getAddressTypeIcon(address.type)}
              <div>
                <p className="font-medium text-gray-900 capitalize">
                  {address.type || 'Address'}
                  {address.first_name && address.last_name && (
                    <span className="text-sm text-gray-500 ml-2">
                      ({address.first_name} {address.last_name})
                    </span>
                  )}
                </p>
                {isDefault && (
                  <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                    <Star className="h-3 w-3 mr-1" />
                    Default Address
                  </Badge>
                )}
              </div>
            </div>
            
            {showActions && (
              <div className="flex items-center space-x-1">
                {!isDefault && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onSetDefault(address)}
                    className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                    title="Set as default"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onEdit(address)}
                  className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700 hover:bg-gray-100"
                  title="Edit address"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete(address)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  title="Delete address"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <div className="text-sm text-gray-600">
            <p>{formatAddress(address)}</p>
            {address.phone && (
              <p className="mt-1">Phone: {address.phone}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AddressForm = ({ 
  address, 
  onSave, 
  onCancel, 
  loading = false 
}) => {
  const [formData, setFormData] = useState({
    type: 'home',
    first_name: '',
    last_name: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    phone: '',
    ...address
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Card className="border-2 border-dashed border-gray-300">
      <CardHeader>
        <CardTitle className="text-lg">
          {address?.id ? 'Edit Address' : 'Add New Address'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Address Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Enter first name"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Enter last name"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter street address"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Enter city"
                required
              />
            </div>
            <div>
              <Label htmlFor="state">State/Province</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                placeholder="Enter state or province"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="postal_code">Postal Code</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="Enter postal code"
                required
              />
            </div>
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Enter country"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter phone number"
            />
          </div>

          <div className="flex items-center space-x-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 mr-2"
                  >
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                  </motion.div>
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Address
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

const AddressManager = ({ userId }) => {
  const { toast } = useToast();
  const [addresses, setAddresses] = useState([]);
  const [orderAddresses, setOrderAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  useEffect(() => {
    fetchAddresses();
  }, [userId]);

  const fetchAddresses = async () => {
    try {
      setLoading(true);

      // Fetch saved addresses
      const { data: savedAddresses, error: addressError } = await supabase
        .from('customer_addresses')
        .select('*')
        .eq('customer_id', userId)
        .order('is_default', { ascending: false });

      if (addressError && addressError.code !== 'PGRST116') {
        throw addressError;
      }

      // Fetch addresses from orders - handle case where shipping columns might not exist
      let orders = [];
      try {
        const { data: orderData, error: orderError } = await supabase
          .from('orders')
          .select(`
            id,
            shipping_first_name,
            shipping_last_name,
            shipping_address,
            shipping_city,
            shipping_state,
            shipping_postal_code,
            shipping_country,
            shipping_phone,
            created_at
          `)
          .or(`user_id.eq.${userId},customer_id.eq.${userId}`)
          .not('shipping_address', 'is', null)
          .order('created_at', { ascending: false });

        if (orderError) {
          console.error('Error fetching order addresses:', orderError);
          // If shipping columns don't exist, fall back to empty array
          if (orderError.code === '42703') {
            console.log('Shipping address columns do not exist in orders table yet');
            orders = [];
          } else {
            throw orderError;
          }
        } else {
          orders = orderData || [];
        }
      } catch (error) {
        console.error('Error in order address fetch:', error);
        orders = [];
      }

      // Process unique addresses from orders
      const uniqueOrderAddresses = [];
      const seenAddresses = new Set();

      orders?.forEach(order => {
        const addressKey = [
          order.shipping_address,
          order.shipping_city,
          order.shipping_state,
          order.shipping_postal_code,
          order.shipping_country
        ].join('|');

        if (!seenAddresses.has(addressKey) && order.shipping_address) {
          seenAddresses.add(addressKey);
          uniqueOrderAddresses.push({
            id: `order-${order.id}`,
            type: 'order',
            first_name: order.shipping_first_name || '',
            last_name: order.shipping_last_name || '',
            address: order.shipping_address || '',
            city: order.shipping_city || '',
            state: order.shipping_state || '',
            postal_code: order.shipping_postal_code || '',
            country: order.shipping_country || '',
            phone: order.shipping_phone || '',
            used_date: order.created_at,
            from_order: true
          });
        }
      });

      setAddresses(savedAddresses || []);
      setOrderAddresses(uniqueOrderAddresses);
      setDefaultAddress(savedAddresses?.find(addr => addr.is_default) || null);

    } catch (error) {
      console.error('Error fetching addresses:', error);
      toast({
        title: "Error",
        description: `Failed to load addresses: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const saveAddress = async (addressData) => {
    try {
      setSaving(true);

      if (editingAddress?.id && !editingAddress.from_order) {
        // Update existing address
        const { error } = await supabase
          .from('customer_addresses')
          .update({
            ...addressData,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAddress.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Address updated successfully",
        });
      } else {
        // Create new address
        const { error } = await supabase
          .from('customer_addresses')
          .insert({
            ...addressData,
            customer_id: userId,
            is_default: addresses.length === 0, // First address is default
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: "Address added successfully",
        });
      }

      setShowForm(false);
      setEditingAddress(null);
      fetchAddresses();

    } catch (error) {
      console.error('Error saving address:', error);
      toast({
        title: "Error",
        description: "Failed to save address",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (address) => {
    if (address.from_order) {
      toast({
        title: "Cannot Delete",
        description: "Cannot delete addresses from orders. You can save it as a new address instead.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('customer_addresses')
        .delete()
        .eq('id', address.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Address deleted successfully",
      });

      fetchAddresses();
    } catch (error) {
      console.error('Error deleting address:', error);
      toast({
        title: "Error",
        description: "Failed to delete address",
        variant: "destructive",
      });
    }
  };

  const setAsDefault = async (address) => {
    if (address.from_order) {
      // Save order address as new default address
      const addressData = {
        type: 'home',
        first_name: address.first_name,
        last_name: address.last_name,
        address: address.address,
        city: address.city,
        state: address.state,
        postal_code: address.postal_code,
        country: address.country,
        phone: address.phone
      };

      await saveAddress(addressData);
      return;
    }

    try {
      // Remove default from all addresses
      await supabase
        .from('customer_addresses')
        .update({ is_default: false })
        .eq('customer_id', userId);

      // Set new default
      const { error } = await supabase
        .from('customer_addresses')
        .update({ is_default: true })
        .eq('id', address.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Default address updated",
      });

      fetchAddresses();
    } catch (error) {
      console.error('Error setting default address:', error);
      toast({
        title: "Error",
        description: "Failed to set default address",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (address) => {
    if (address.from_order) {
      // For order addresses, create a new address
      setEditingAddress(null);
      setShowForm(true);
      // Pre-fill form with order address data
      setTimeout(() => {
        setEditingAddress(address);
      }, 100);
    } else {
      setEditingAddress(address);
      setShowForm(true);
    }
  };

  const allAddresses = [...addresses, ...orderAddresses];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8"
        >
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Address Book</h3>
          <p className="text-sm text-gray-500">
            Manage your saved addresses and addresses from previous orders
          </p>
        </div>
        <Button
          onClick={() => {
            setEditingAddress(null);
            setShowForm(true);
          }}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Address
        </Button>
      </div>

      {showForm && (
        <AddressForm
          address={editingAddress}
          onSave={saveAddress}
          onCancel={() => {
            setShowForm(false);
            setEditingAddress(null);
          }}
          loading={saving}
        />
      )}

      {allAddresses.length === 0 ? (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <MapPin className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Addresses Found</h3>
            <p className="text-gray-500 mb-6">
              Add your first address to get started with faster checkouts
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Address
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Saved Addresses */}
          {addresses.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Saved Addresses ({addresses.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {addresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isDefault={address.is_default}
                    onEdit={handleEdit}
                    onDelete={deleteAddress}
                    onSetDefault={setAsDefault}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Addresses from Orders */}
          {orderAddresses.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                <MapPin className="w-4 h-4 mr-2" />
                Addresses from Orders ({orderAddresses.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderAddresses.map((address) => (
                  <AddressCard
                    key={address.id}
                    address={address}
                    isDefault={false}
                    onEdit={handleEdit}
                    onDelete={deleteAddress}
                    onSetDefault={setAsDefault}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AddressManager; 