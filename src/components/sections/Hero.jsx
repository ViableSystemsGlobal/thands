
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { api } from "@/lib/services/api";
import LazyImage from "@/components/ui/LazyImage";
import { getImageUrl } from "@/lib/utils/imageUtils";

const Hero = () => {
  const [heroSettings, setHeroSettings] = useState({
    hero_image_url: "https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/f9e9c1ced82f14bddc858a8dd7b36cff.png",
    hero_title: "Modern Elegance Redefined",
    hero_subtitle: "Discover our collection of meticulously crafted African-inspired pieces that blend traditional aesthetics with contemporary design.",
    hero_button_text: "EXPLORE COLLECTION"
  });

  useEffect(() => {
    const fetchHeroSettings = async () => {
      try {
        const response = await api.get('/admin/settings');
        
        if (response.success && response.settings) {
          const settings = response.settings;
          setHeroSettings({
            hero_image_url: settings.hero_image_url || heroSettings.hero_image_url,
            hero_title: settings.hero_title || heroSettings.hero_title,
            hero_subtitle: settings.hero_subtitle || heroSettings.hero_subtitle,
            hero_button_text: settings.hero_button_text || heroSettings.hero_button_text,
          });
        }
      } catch (error) {
        console.error('Error fetching hero settings:', error);
        // Keep default values if fetch fails
      }
    };

    fetchHeroSettings();
  }, []);

  // Get optimized hero image URL
  const optimizedHeroImageUrl = getImageUrl(heroSettings.hero_image_url);

  return (
    <section className="relative min-h-screen">
      <div className="absolute inset-0">
        <LazyImage  
          className="w-full h-full object-cover object-top"
          alt="Fashion hero image" 
          src={optimizedHeroImageUrl || heroSettings.hero_image_url} />
      </div>
      
      <div className="relative container mx-auto px-4 min-h-screen flex items-end pb-24 md:pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-2xl bg-white/80 backdrop-blur-sm p-8 md:p-12 rounded-lg"
        >
          <h1 className="text-5xl md:text-6xl font-light mb-6 text-[#1A1A1A] tracking-wider font-serif">
            {heroSettings.hero_title}
          </h1>
          <p className="text-lg md:text-xl mb-8 text-[#1A1A1A]/80">
            {heroSettings.hero_subtitle}
          </p>
          <Link to="/shop">
            <Button 
              size="lg" 
              className="bg-[#1A1A1A] text-white hover:bg-[#2A2A2A] px-12 py-6 text-lg tracking-wider"
            >
              {heroSettings.hero_button_text}
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
