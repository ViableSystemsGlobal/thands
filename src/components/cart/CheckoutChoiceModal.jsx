import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, User, UserCheck, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CheckoutChoiceModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const handleGuestCheckout = () => {
    // Proceed to checkout as guest
    navigate("/checkout");
    onClose();
  };

  const handleLoginCheckout = () => {
    // Redirect to login page with return URL
    navigate("/login", { 
      state: { 
        from: { pathname: "/checkout" },
        message: "Please login to continue with your checkout"
      } 
    });
    onClose();
  };

  const handleContinueAsUser = () => {
    // User is already logged in, proceed to checkout
    navigate("/checkout");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        
        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="relative bg-white rounded-xl p-6 mx-4 max-w-md w-full shadow-2xl"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>

          {/* Header */}
          <div className="text-center mb-6">
            <div className="h-12 w-12 rounded-full bg-[#D2B48C] flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Checkout?
            </h2>
            <p className="text-gray-600 text-sm">
              {isAuthenticated 
                ? `Welcome back, ${user?.firstName || 'there'}! You can continue with your checkout.`
                : "Choose how you'd like to proceed with your order."
              }
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {isAuthenticated ? (
              // User is already logged in
              <Button
                onClick={handleContinueAsUser}
                className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-3 text-base"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Continue as {user?.firstName || 'User'}
              </Button>
            ) : (
              // User is not logged in
              <>
                <Button
                  onClick={handleLoginCheckout}
                  className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-3 text-base"
                >
                  <User className="h-4 w-4 mr-2" />
                  Login to Checkout
                </Button>
                
                <Button
                  onClick={handleGuestCheckout}
                  variant="outline"
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 py-3 text-base"
                >
                  <User className="h-4 w-4 mr-2" />
                  Continue as Guest
                </Button>
              </>
            )}
          </div>

          {/* Benefits info */}
          {!isAuthenticated && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Benefits of logging in:
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• Save your order history</li>
                <li>• Faster checkout next time</li>
                <li>• Track your orders easily</li>
                <li>• Access exclusive offers</li>
              </ul>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CheckoutChoiceModal;
