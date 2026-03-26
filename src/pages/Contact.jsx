
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { api } from "@/lib/services/api";
import RecaptchaComponent from "@/components/ui/recaptcha";
import { useSettings } from "@/hooks/useSettings";

const Contact = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [storeInfo, setStoreInfo] = useState({
    storeName: "Tailored Hands",
    email: "hello@tailoredhands.africa",
    phone: "+233 24 532 7668",
    address: "Nii Odai Ayiku Road, Accra, Ghana"
  });

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaError = (error) => {
    console.error('reCAPTCHA error:', error);
    setRecaptchaToken(null);
    toast({
      title: "reCAPTCHA Error",
      description: "Please complete the reCAPTCHA verification.",
      variant: "destructive",
    });
  };

  // Fetch store information from settings
  useEffect(() => {
    const fetchStoreInfo = async () => {
      try {
        const response = await api.get('/admin/settings');

        if (!response.success) {
          console.error('Error fetching store info:', response.error);
          return;
        }

        if (response.settings) {
          setStoreInfo({
            storeName: response.settings.store_name || "Tailored Hands",
            email: response.settings.contact_email || "hello@tailoredhands.africa",
            phone: response.settings.contact_phone || "+233 24 532 7668",
            address: "Nii Odai Ayiku Road, Accra, Ghana" // No address field in current schema
          });
        }
      } catch (error) {
        console.error('Error fetching store info:', error);
      }
    };

    fetchStoreInfo();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (settings.captchaEnabled && !recaptchaToken) {
      toast({
        title: "reCAPTCHA Required",
        description: "Please complete the reCAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = {
        name: e.target.name.value,
        email: e.target.email.value,
        subject: e.target.subject.value,
        message: e.target.message.value,
        recaptcha_token: recaptchaToken
      };

      const response = await api.post('/messages', formData);

      if (!response.success) throw new Error(response.error || 'Failed to send message');

      toast({
        title: "Message Sent",
        description: "We'll get back to you as soon as possible.",
      });

      // Reset form
      e.target.reset();
      setRecaptchaToken(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
      
      setRecaptchaToken(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24 pb-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="text-4xl md:text-5xl font-light mb-8 font-serif tracking-wide text-center">
            Contact Us
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div className="space-y-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-light">Get in Touch</h2>
                <p className="text-gray-600">
                  Have questions about our products or services? We're here to help.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <MapPin className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Visit Us</h3>
                    <p className="text-gray-600">
                      {storeInfo.address}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Phone className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Call Us</h3>
                    <p className="text-gray-600">
                      {storeInfo.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Mail className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Email Us</h3>
                    <p className="text-gray-600">{storeInfo.email}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <Clock className="w-6 h-6 text-gray-400 mt-1" />
                  <div>
                    <h3 className="font-medium">Opening Hours</h3>
                    <p className="text-gray-600">
                      Monday - Friday: 9:00 AM - 6:00 PM<br />
                      Saturday: 10:00 AM - 4:00 PM<br />
                      Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="Your name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    required
                    className="w-full p-2 border rounded-md"
                    placeholder="How can we help?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea
                    name="message"
                    required
                    className="w-full p-2 border rounded-md h-32"
                    placeholder="Your message"
                  ></textarea>
                </div>

                <div>
                  <RecaptchaComponent
                    onChange={handleRecaptchaChange}
                    onError={handleRecaptchaError}
                    action="contact"
                    className="mt-2"
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting || (settings.captchaEnabled && !recaptchaToken)}
                  className="w-full bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white"
                >
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden h-[400px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d4429.606284962151!2d-0.0841021373594941!3d5.617789417660356!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf85362b056373%3A0x6a36136c8dc44420!2sTailored%20Hands!5e0!3m2!1sen!2sus!4v1745807412822!5m2!1sen!2sus"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Contact;
