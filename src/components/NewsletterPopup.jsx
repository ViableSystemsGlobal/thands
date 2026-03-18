import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, Mail, Gift, Star, Sparkles } from 'lucide-react';
import { api } from '@/lib/services/api.js';
import { useToast } from '@/components/ui/use-toast';

const NewsletterPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newsletterConfig, setNewsletterConfig] = useState({
    title: 'Get 15% Off Your First Order!',
    subtitle: 'Join our newsletter for exclusive offers',
    description: 'Be the first to know about new arrivals, sales, and special promotions.',
    offer_text: 'Use code WELCOME15 at checkout',
    button_text: 'Claim Your Discount',
    image_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
    is_enabled: true
  });

  const { toast } = useToast();

  useEffect(() => {
    const popupSeen = localStorage.getItem('newsletter_popup_seen');
    const emailSubscribed = localStorage.getItem('newsletter_subscribed');

    if (!popupSeen && !emailSubscribed) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);

    try {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        toast({
          title: "Invalid Email",
          description: "Please enter a valid email address.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Subscribe via backend API
      try {
        await api.post('/newsletter/subscribe', {
          email: email.toLowerCase().trim(),
          source: 'popup'
        });
      } catch (subscribeError) {
        if (subscribeError.message && subscribeError.message.toLowerCase().includes('already subscribed')) {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter.",
            variant: "default",
          });
          localStorage.setItem('newsletter_subscribed', 'true');
          localStorage.setItem('newsletter_popup_seen', 'true');
          setIsVisible(false);
          setIsSubmitting(false);
          return;
        }
        // Non-fatal: still proceed to show success for UX
        console.warn('Newsletter subscribe error (non-fatal):', subscribeError.message);
      }

      toast({
        title: "Welcome to our Newsletter!",
        description: "Check your email for your exclusive discount code.",
        className: "bg-green-50 border-green-200 text-green-700",
      });

      localStorage.setItem('newsletter_subscribed', 'true');
      localStorage.setItem('newsletter_popup_seen', 'true');
      setIsVisible(false);

    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast({
        title: "Subscription Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    localStorage.setItem('newsletter_popup_seen', 'true');
    setIsVisible(false);
  };

  if (!isVisible || !newsletterConfig.is_enabled) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative bg-white rounded-2xl shadow-2xl overflow-hidden max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors p-2"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header with image */}
          <div className="relative">
            <img
              src={newsletterConfig.image_url}
              alt="Newsletter offer"
              className="w-full h-48 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute top-4 left-4 flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] rounded-full p-3">
                  <Gift className="w-6 h-6 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {newsletterConfig.title}
              </h2>

              <p className="text-gray-600 mb-1">
                {newsletterConfig.subtitle}
              </p>

              <p className="text-sm text-gray-500 mb-4">
                {newsletterConfig.description}
              </p>

              {/* Offer highlight */}
              <div className="bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] text-white px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-flex items-center space-x-2">
                <Sparkles className="w-4 h-4" />
                <span>{newsletterConfig.offer_text}</span>
              </div>
            </div>

            {/* Email form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 py-3 text-center border-2 border-gray-200 focus:border-[#D2B48C] rounded-xl"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#D2B48C] to-[#C19A6B] hover:from-[#C19A6B] hover:to-[#A0845C] text-white py-3 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Subscribing...
                  </div>
                ) : (
                  newsletterConfig.button_text
                )}
              </Button>
            </form>

            {/* Footer */}
            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                By subscribing, you agree to receive marketing emails from TailoredHands.
                <br />
                You can unsubscribe at any time.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NewsletterPopup;
