import React, { useState } from "react";
import { useShop } from "@/context/ShopContext";
import { useCurrency } from "@/context/CurrencyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Tag, XCircle, Gift } from "lucide-react";

const CheckoutOrderSummary = ({ 
  shippingRule, 
  loading: formLoading, 
  calculatedShippingCost, 
  displayCurrency: propDisplayCurrency,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  appliedCoupon,
  couponDiscount,
  couponLoading,
  showSubmitButton = true,
  submitButtonText = "Continue to Order Verification",
  onSubmit
}) => {
  const { cart, cartTotal, cartItemsCount } = useShop();
  const { formatPrice, currency } = useCurrency(); 

  // Use the user's selected currency from context, not a default
  const displayCurrency = currency; 

  const subtotal = cartTotal;
  const shippingCost = calculatedShippingCost || (shippingRule?.shipping_cost ?? 0);
  const totalBeforeDiscount = subtotal + shippingCost;
  const finalDiscount = couponDiscount || 0;
  const total = totalBeforeDiscount - finalDiscount;

  const getImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    // Use local API for images
    return `http://localhost:3003/api/images/${imagePath}`;
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-8 w-8 rounded-full bg-[#D2B48C] flex items-center justify-center">
          <Lock className="h-4 w-4 text-white" />
        </div>
        <h2 className="text-xl font-medium">Order Summary</h2>
      </div>
      <div className="space-y-4 mb-6">
        {cart.map((item) => {
          const imageUrl = getImageUrl(item.products?.image_url || item.gift_voucher_types?.image_url);
          return (
            <div key={item.id || item.product_id || item.gift_voucher_type_id} className="flex items-start text-sm gap-3">
              {imageUrl ? (
                <img  
                  alt={item.products?.name || item.gift_voucher_types?.name || "Product Image"}
                  className="w-16 h-16 object-cover rounded"
                  src={imageUrl} />
              ) : (
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                  No Image
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium text-gray-800 leading-tight">
                  {item.products?.name || item.gift_voucher_types?.name || (item.is_gift_voucher ? "Gift Voucher" : "Product")} {item.size ? `(${item.size})` : ""}
                </p>
                <p className="text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-gray-700 font-medium">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Subtotal ({cartItemsCount} items)</span>
          <span className="text-gray-800 font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="text-gray-800 font-medium">
            {shippingRule ? formatPrice(shippingCost) : (shippingRule === null && cart.length > 0 ? "Select country" : "N/A")}
          </span>
        </div>

        {!appliedCoupon && (
          <div className="pt-2 pb-1">
            <Label htmlFor="coupon-code" className="text-xs font-medium text-gray-600">Have a coupon or gift voucher?</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="coupon-code"
                type="text"
                placeholder="Enter coupon code or gift voucher code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                className="h-9 text-sm"
                disabled={couponLoading || !!appliedCoupon}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleApplyCoupon}
                disabled={couponLoading || !couponCode.trim()}
                className="h-9"
              >
                {couponLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter a coupon code for discounts or a gift voucher code to redeem balance
            </p>
          </div>
        )}

        {appliedCoupon && (
          <div className="flex justify-between text-sm text-green-600 pt-2">
            <div className="flex items-center">
              {appliedCoupon.type === 'gift_voucher' ? (
                <Gift className="w-4 h-4 mr-1" />
              ) : (
                <Tag className="w-4 h-4 mr-1" />
              )}
              <span>{appliedCoupon.type === 'gift_voucher' ? 'Gift Voucher' : 'Coupon'}: {appliedCoupon.code}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6 ml-1" onClick={handleRemoveCoupon}>
                <XCircle className="h-4 w-4 text-red-500" />
              </Button>
            </div>
            <span className="font-medium">-{formatPrice(finalDiscount)}</span>
          </div>
        )}
        
        {displayCurrency === "USD" && (
          <>
            <div className="flex justify-between text-xs text-gray-500 pt-1">
              <span>Subtotal (GHS)</span>
              <span>~{formatPrice(subtotal, false, "GHS")}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>Shipping (GHS)</span>
              <span>
                {shippingRule ? `~${formatPrice(shippingCost, false, "GHS")}` : (shippingRule === null && cart.length > 0 ? "Select country" : "N/A")}
              </span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-xs text-green-500">
                <span>Discount (GHS)</span>
                <span>~-{formatPrice(finalDiscount, false, "GHS")}</span>
              </div>
            )}
          </>
        )}

        <div className="flex justify-between text-lg font-semibold border-t pt-3 mt-3">
          <span className="text-gray-900">Total</span>
          <span className="text-gray-900">{formatPrice(total)}</span>
        </div>
        {displayCurrency === "USD" && (
          <div className="flex justify-between text-md font-medium text-gray-600">
            <span>Total (GHS Approx.)</span>
            <span>~{formatPrice(total, false, "GHS")}</span>
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mt-6 text-center">
        Your payment will be processed in {displayCurrency === "USD" ? "GHS" : displayCurrency}.
      </p>

      {showSubmitButton && (
        <div className="mt-6">
          <Button
            type="button"
            onClick={onSubmit}
            disabled={formLoading || cart.length === 0 || couponLoading}
            className="w-full bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] hover:from-[#C19A6B] hover:to-[#B8956A] text-white font-semibold py-6 text-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {formLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                {submitButtonText}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

export default CheckoutOrderSummary;
