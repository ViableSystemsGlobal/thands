import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, User, UserCheck, ShoppingCart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const CheckoutChoiceModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  // Debug logging
  React.useEffect(() => {
    if (isOpen) {
      console.log('🔍 CheckoutChoiceModal: isAuthenticated:', isAuthenticated, 'user:', user);
    }
  }, [isOpen, isAuthenticated, user]);

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

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Full-screen overlay with grid centering - using inline styles for reliable positioning */}
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
            }}
            onClick={onClose}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                backdropFilter: 'blur(4px)',
              }}
            />
            
            {/* Modal - centered using flexbox */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.3 }}
              style={{
                position: 'relative',
                backgroundColor: 'white',
                borderRadius: '0.75rem',
                padding: '1.5rem',
                maxWidth: '28rem',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                maxHeight: '85vh',
                overflowY: 'auto',
              }}
              onClick={(e) => e.stopPropagation()}
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

          {/* Options - Always show both options for non-authenticated users */}
          {isAuthenticated ? (
            // User is already logged in
            <div className="space-y-3">
              <Button
                onClick={handleContinueAsUser}
                className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-3 text-base font-medium"
              >
                <UserCheck className="h-4 w-4 mr-2" />
                Continue to Checkout
              </Button>
            </div>
          ) : (
            // User is not logged in - Show both options clearly
            <div className="space-y-4">
              {/* Primary: Continue as Guest */}
              <Button
                onClick={handleGuestCheckout}
                className="w-full bg-[#D2B48C] hover:bg-[#C19A6B] text-white py-4 text-base font-semibold shadow-lg"
              >
                <User className="h-5 w-5 mr-2" />
                Continue as Guest
              </Button>
              
              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-gray-500 font-medium">Or</span>
                </div>
              </div>
              
              {/* Secondary: Login */}
              <Button
                onClick={handleLoginCheckout}
                variant="outline"
                className="w-full border-2 border-[#D2B48C] text-[#D2B48C] hover:bg-[#D2B48C] hover:text-white py-4 text-base font-semibold"
              >
                <UserCheck className="h-5 w-5 mr-2" />
                Login to Checkout
              </Button>

              {/* Benefits info - Only show if not authenticated */}
              <div className="mt-6 p-5 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                  Benefits of logging in:
                </h4>
                <ul className="text-sm text-gray-700 space-y-2.5">
                  <li className="flex items-start">
                    <span className="text-[#D2B48C] mr-2 font-bold text-base">✓</span>
                    <span>Save your order history</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D2B48C] mr-2 font-bold text-base">✓</span>
                    <span>Faster checkout next time</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D2B48C] mr-2 font-bold text-base">✓</span>
                    <span>Track your orders easily</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#D2B48C] mr-2 font-bold text-base">✓</span>
                    <span>Access exclusive offers</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-gray-200 text-center">
            <button
              onClick={onClose}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Cancel
            </button>
          </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  // Use portal to render directly to body, bypassing any parent CSS transforms
  return createPortal(modalContent, document.body);
};

export default CheckoutChoiceModal;
