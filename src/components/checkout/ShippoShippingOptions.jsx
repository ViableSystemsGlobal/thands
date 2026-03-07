import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Truck, Clock, DollarSign, CheckCircle } from 'lucide-react';
import { useCurrency } from '@/context/CurrencyContext';
import { api } from '@/lib/services/api';

const ShippoShippingOptions = ({ 
  address, 
  cartItems, 
  onShippingSelected, 
  selectedShipping,
  loading: parentLoading = false 
}) => {
  const [shippingRates, setShippingRates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [shippingSource, setShippingSource] = useState(null); // 'dhl' or 'manual'
  const [calculationDetails, setCalculationDetails] = useState(null); // dev only
  const { formatPrice } = useCurrency();
  const isDev = import.meta.env.DEV;

  // Check if address is international (not Ghana)
  const isInternational = address?.country && address.country !== 'Ghana' && address.country !== 'GH';

  const isAddressComplete = (addr) =>
    addr?.address && addr?.city && addr?.country && addr?.postalCode;

  useEffect(() => {
    if (isAddressComplete(address) && cartItems?.length > 0) {
      fetchShippingRates();
    }
  // Re-fetch only when the key address fields change, not on every keystroke
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.country, address?.postalCode, address?.city, address?.address, cartItems?.length]);

  const fetchShippingRates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Create a temporary order to get shipping rates
      const orderData = {
        items: cartItems.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          size: item.size
        })),
        address: {
          name: `${address.firstName} ${address.lastName}`,
          street1: address.address,
          city: address.city,
          state: address.state,
          zip: address.postalCode,
          country: address.country
        }
      };

      console.log('🚢 Sending shipping rates request:', orderData);
      
      const data = await api.post('/shipping/rates', orderData);

      if (data.success && Array.isArray(data.rates)) {
        setShippingRates(data.rates);
        setShippingSource(data.source || 'dhl');
        setCalculationDetails(data.calculationDetails || null);
        // Auto-select the first (usually cheapest) option when we have rates
        if (data.rates.length > 0 && !selectedShipping) {
          onShippingSelected(data.rates[0]);
        }
      } else {
        setCalculationDetails(null);
        setError(data.error || 'No shipping options available for this address.');
      }
    } catch (err) {
      console.error('Error fetching shipping rates:', err);
      setError('Failed to load shipping options');
      setCalculationDetails(null);
    } finally {
      setLoading(false);
    }
  };

  // Use the currency context's formatPrice for proper conversion
  // The shipping rates come in USD, and we need to convert to user's currency
  const formatShippingAmount = (amount, rateCurrency = 'USD') => {
    // If the rate is in USD and we're displaying in GHS, use formatPrice for conversion
    // formatPrice from useCurrency context handles the conversion automatically
    return formatPrice(amount);
  };

  const getEstimatedDays = (rate) => {
    // If rate has estimatedDays as a string (e.g., "7-14"), return it
    if (typeof rate.estimatedDays === 'string' && rate.estimatedDays.includes('-')) {
      return rate.estimatedDays;
    }
    // If rate has estimatedDays as a number, return it
    if (typeof rate.estimatedDays === 'number') {
      return rate.estimatedDays;
    }
    // Simple estimation based on service level
    const service = rate.service?.toLowerCase() || '';
    if (service.includes('express')) return 2;
    if (service.includes('standard')) return 5;
    if (service.includes('economy')) return 10;
    return 7; // Default
  };

  const shippingTitle = isInternational ? 'International Shipping Options' : 'Domestic Shipping Options';

  if (loading || parentLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className={`w-5 h-5 ${isInternational ? 'text-blue-600' : 'text-green-600'}`} />
            {shippingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading shipping options...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className={`w-5 h-5 ${isInternational ? 'text-blue-600' : 'text-green-600'}`} />
            {shippingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-red-600 mb-2">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchShippingRates}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (shippingRates.length === 0) {
    const fallbackOption = isInternational
      ? { id: 'fallback-international', service: 'Standard International', amount: 50.00, currency: 'USD', estimated_days: '7-14 business days' }
      : { id: 'fallback-domestic', service: 'Standard Domestic', amount: 0, currency: 'GHS', estimated_days: '2-5 business days' };
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className={`w-5 h-5 ${isInternational ? 'text-blue-600' : 'text-green-600'}`} />
            {shippingTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            {isInternational
              ? 'No shipping options available. Try again or use the standard rate below.'
              : 'No domestic rates returned. You can use the standard option below or try again.'}
          </p>
          <div 
            className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
            onClick={() => onShippingSelected(fallbackOption)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{fallbackOption.service}</p>
                <p className="text-xs text-gray-600">{fallbackOption.estimated_days}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatPrice(fallbackOption.amount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className={`w-5 h-5 ${isInternational ? 'text-blue-600' : 'text-green-600'}`} />
          {shippingTitle}
          {shippingSource === 'manual' && (
            <Badge variant="outline" className="ml-2 text-xs">
              Standard Rates
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {shippingRates.map((rate) => (
          <div
            key={rate.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedShipping?.id === rate.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onShippingSelected(rate)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center">
                  {selectedShipping?.id === rate.id && (
                    <CheckCircle className="w-3 h-3 text-blue-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{rate.carrier}</Badge>
                    <span className="font-medium">{rate.service}</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {rate.description}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {formatShippingAmount(rate.cost, rate.currency)}
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="w-3 h-3" />
                  {getEstimatedDays(rate)} {typeof getEstimatedDays(rate) === 'number' ? 'days' : ''}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <div className="pt-2 text-xs text-gray-500">
          <p>• All prices include insurance and tracking</p>
          <p>• Delivery times are estimates and may vary</p>
          <p>• Duties and taxes may apply at destination</p>
          {shippingSource === 'manual' && (
            <p className="text-blue-600 mt-1">• Using standard shipping rates</p>
          )}
        </div>

        {isDev && calculationDetails && (
          <div className="mt-4 pt-4 border-t border-dashed border-amber-200 bg-amber-50/50 rounded-lg p-3 text-xs font-mono text-gray-700">
            <p className="font-sans font-semibold text-amber-800 mb-2">🔧 Development: calculation details</p>
            <pre className="whitespace-pre-wrap break-words overflow-x-auto">
              {JSON.stringify(calculationDetails, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ShippoShippingOptions;
