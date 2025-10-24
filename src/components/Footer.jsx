
import React from "react";
import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="space-y-4">
            <h3 className="text-xl font-light tracking-wider">TAILORED HANDS</h3>
            <p className="text-gray-400">
              Crafting elegance through modern African-inspired fashion.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-light">Collections</h4>
            <ul className="space-y-2">
              <li><Link to="/collections/kaftans" className="text-gray-400 hover:text-white transition-colors">Kaftans</Link></li>
              <li><Link to="/collections/african" className="text-gray-400 hover:text-white transition-colors">African</Link></li>
              <li><Link to="/collections/short-sleeve" className="text-gray-400 hover:text-white transition-colors">Short-Sleeve</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-light">Information</h4>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="/track-order" className="text-gray-400 hover:text-white transition-colors">Order Tracking</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-white transition-colors">Returns</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="text-lg font-light">Connect</h4>
            <div className="flex space-x-4">
              <a href="https://www.instagram.com/tailoredhands/?hl=en" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="https://www.facebook.com/tailoredhands/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-6 w-6" />
              </a>
              <a href="https://www.tiktok.com/discover/official-tailored-hands" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
            </div>
            <p className="text-gray-400">
              Subscribe to our newsletter for updates and exclusive offers.
            </p>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; {new Date().getFullYear()} Tailored Hands. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
