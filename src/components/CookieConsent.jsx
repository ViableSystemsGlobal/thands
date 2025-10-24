import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Cookie, Shield, Users, TrendingUp } from 'lucide-react';

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Show popup after 2 seconds
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    
    // Enable analytics, marketing cookies here
    console.log('🍪 Cookies accepted - Analytics and marketing enabled');
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    localStorage.setItem('cookie_consent_date', new Date().toISOString());
    setIsVisible(false);
    
    // Disable non-essential cookies
    console.log('🍪 Cookies declined - Only essential cookies enabled');
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // Don't save anything, show again later
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 100, scale: 0.8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cookie className="w-5 h-5" />
                <h3 className="font-semibold text-lg">Cookie Settings</h3>
              </div>
              <button
                onClick={handleDismiss}
                className="text-white hover:text-gray-200 transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-gray-700 text-sm mb-4">
              We use cookies to enhance your shopping experience, personalize content, and analyze our traffic.
            </p>

            {/* Expandable section */}
            <motion.div
              initial={false}
              animate={{ height: isExpanded ? 'auto' : 0 }}
              className="overflow-hidden"
            >
              <div className="space-y-3 mb-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Essential Cookies</h4>
                    <p className="text-xs text-gray-600">Required for website functionality</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Analytics Cookies</h4>
                    <p className="text-xs text-gray-600">Help us understand how you use our site</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Users className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-sm text-gray-800">Marketing Cookies</h4>
                    <p className="text-xs text-gray-600">Personalize ads and content</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Toggle details */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[#D2B48C] hover:text-[#C19A6B] text-sm font-medium mb-4 transition-colors"
            >
              {isExpanded ? 'Show Less' : 'Learn More'}
            </button>

            {/* Action buttons */}
            <div className="flex space-x-2">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-[#D2B48C] hover:bg-[#C19A6B] text-white text-sm py-2 px-4 transition-colors"
              >
                Accept All
              </Button>
              <Button
                onClick={handleDecline}
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 text-sm py-2 px-4 transition-colors"
              >
                Decline
              </Button>
            </div>

            {/* Privacy policy link */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              By continuing, you agree to our{' '}
              <a href="/privacy" className="text-[#D2B48C] hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CookieConsent; 