
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Instagram, Loader2 } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { api } from "@/lib/services/api";
import { getImageUrl, getPlaceholderImageUrl } from "@/lib/utils/imageUtils";

// Custom TikTok icon component
const TikTokIcon = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

const SocialMediaFeed = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products?limit=8');

      if (response.products) {
        setProducts(response.products || []);
      } else {
        throw new Error('No products found');
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </section>
    );
  }

  // Split products into two arrays for Instagram and TikTok
  const instagramProducts = products.slice(0, 4);
  const tiktokProducts = products.slice(4, 8);

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Instagram Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light mb-6 font-serif tracking-wide">
            @tailoredhands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Follow us on Instagram for daily inspiration and behind-the-scenes moments
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {instagramProducts.map((product, index) => (
            <motion.a
              key={product.id}
              href="https://instagram.com/tailoredhands"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-square overflow-hidden"
            >
              <img
                src={getImageUrl(product.image_url) || getPlaceholderImageUrl()}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <Instagram className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-24"
        >
          <a
            href="https://instagram.com/tailoredhands"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              variant="outline" 
              className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors group"
            >
              Follow Us on Instagram
              <Instagram className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </motion.div>

        {/* TikTok Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light mb-6 font-serif tracking-wide">
            @officialtailoredhands
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join us on TikTok for trending styles and fashion tips
          </p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {tiktokProducts.map((product, index) => (
            <motion.a
              key={product.id}
              href="https://www.tiktok.com/@officialtailoredhands"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group relative aspect-square overflow-hidden"
            >
              <img
                src={getImageUrl(product.image_url) || getPlaceholderImageUrl()}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <TikTokIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <a
            href="https://www.tiktok.com/@officialtailoredhands"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              variant="outline" 
              className="border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white transition-colors group"
            >
              Follow Us on TikTok
              <TikTokIcon className="ml-2 h-4 w-4" />
            </Button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default SocialMediaFeed;
