import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Truck, 
  Package, 
  MapPin, 
  Clock, 
  DollarSign, 
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

const InternationalShipping = ({ order, onLabelCreated, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [rates, setRates] = useState([]);
  const [selectedRate, setSelectedRate] = useState(null);
  const [address, setAddress] = useState({
    name: order?.shipping_first_name + ' ' + order?.shipping_last_name || '',
    street1: order?.shipping_address || '',
    city: order?.shipping_city || '',
    state: order?.shipping_state || '',
    zip: order?.shipping_zip || '',
    country: order?.shipping_country || ''
  });
  const [labelCreated, setLabelCreated] = useState(false);
  const { toast } = useToast();

  // Check if order is international
  const isInternational = order?.shipping_country && order?.shipping_country !== 'GH';

  useEffect(() => {
    if (isInternational && !order?.tracking_number) {
      getShippingRates();
    }
  }, [order]);

  const getShippingRates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3003/api/shipping/rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_auth_token')}`
        },
        body: JSON.stringify({
          orderId: order.id,
          address: address
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setRates(data.rates);
        toast({
          title: "Shipping rates loaded",
          description: `Found ${data.rates.length} shipping options`,
        });
      } else {
        throw new Error(data.error || 'Failed to get shipping rates');
      }
    } catch (error) {
      console.error('Error getting shipping rates:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLabel = async () => {
    if (!selectedRate) {
      toast({
        title: "No rate selected",
        description: "Please select a shipping rate first",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3003/api/shipping/label`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_auth_token')}`
        },
        body: JSON.stringify({
          orderId: order.id,
          rateId: selectedRate.id
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setLabelCreated(true);
        toast({
          title: "Shipping label created",
          description: `Tracking: ${data.label.trackingNumber}`,
        });
        
        if (onLabelCreated) {
          onLabelCreated(data.label);
        }
      } else {
        throw new Error(data.error || 'Failed to create label');
      }
    } catch (error) {
      console.error('Error creating label:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  if (!isInternational) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Domestic Shipping
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This order is being shipped within Ghana. No international shipping label is needed.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (order?.tracking_number) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Label Created
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="w-3 h-3" />
              {order.shipping_carrier}
            </Badge>
            <Badge variant="secondary">
              {order.shipping_service}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tracking Number</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={order.tracking_number} 
                readOnly 
                className="font-mono"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(`https://www.google.com/search?q=${order.tracking_number}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {order.shipping_label_url && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Shipping Label</Label>
              <Button
                variant="outline"
                onClick={() => window.open(order.shipping_label_url, '_blank')}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Download Label
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          International Shipping
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address Information */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium">Shipping Address</Label>
            <div className="mt-2 p-3 bg-muted rounded-md">
              <p className="font-medium">{address.name}</p>
              <p>{address.street1}</p>
              <p>{address.city}, {address.state} {address.zip}</p>
              <p className="font-medium">{address.country}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Shipping Rates */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Shipping Options</Label>
            {rates.length === 0 && !loading && (
              <Button
                variant="outline"
                size="sm"
                onClick={getShippingRates}
              >
                Get Rates
              </Button>
            )}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Getting shipping rates...</span>
            </div>
          )}

          {rates.length > 0 && (
            <div className="space-y-3">
              {rates.map((rate) => (
                <div
                  key={rate.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedRate?.id === rate.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedRate(rate)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                        {selectedRate?.id === rate.id && (
                          <div className="w-2 h-2 bg-primary rounded-full" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{rate.carrier}</Badge>
                          <span className="font-medium">{rate.service}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {rate.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">
                        {formatCurrency(rate.cost, rate.currency)}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {rate.estimatedDays} days
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {rates.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mx-auto mb-2" />
              <p>No shipping rates available</p>
              <p className="text-sm">Click "Get Rates" to fetch shipping options</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancel
          </Button>
          
          <Button
            onClick={createLabel}
            disabled={!selectedRate || loading}
            className="flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Package className="w-4 h-4" />
            )}
            Create Label
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default InternationalShipping;
