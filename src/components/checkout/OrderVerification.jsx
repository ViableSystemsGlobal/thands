import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  CheckCircle
} from "lucide-react";

const OrderVerification = ({ 
  formData, 
  shippingRule, 
  calculatedShippingCost,
  appliedCoupon,
  couponDiscount,
  onBack, 
  loading 
}) => {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500 mr-3" />
          <h1 className="text-3xl font-light text-gray-800">Verify Your Order</h1>
        </div>
        <p className="text-gray-600">Please review your order details before proceeding to payment</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Shipping Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="w-5 h-5 mr-2" />
              Shipping Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center space-x-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">
                {formData.firstName} {formData.lastName}
              </span>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{formData.email}</span>
            </div>
            <div className="flex items-center space-x-3">
              <Phone className="w-4 h-4 text-gray-500" />
              <span className="text-gray-900">{formData.phone}</span>
            </div>
            <div className="border-t border-gray-200 my-3"></div>
            <div className="space-y-1">
              <p className="font-medium text-gray-900">Delivery Address:</p>
              <p className="text-gray-700">{formData.address}</p>
              <p className="text-gray-700">
                {formData.city}, {formData.state} {formData.postalCode}
              </p>
              <p className="text-gray-700">{formData.country}</p>
            </div>
            {shippingRule && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Shipping Method:</p>
                <p className="text-sm text-blue-700">{shippingRule.name}</p>
                {shippingRule.delivery_time && (
                  <p className="text-xs text-blue-600">
                    Estimated delivery: {shippingRule.delivery_time}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Notes */}
      {formData.orderNotes && (
        <Card>
          <CardHeader>
            <CardTitle>Order Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-700">{formData.orderNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-start pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex items-center justify-center"
          disabled={loading}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Edit
        </Button>
      </div>
    </motion.div>
  );
};

export default OrderVerification; 