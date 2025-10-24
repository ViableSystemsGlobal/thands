
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const BespokeServices = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <h2 className="text-4xl md:text-5xl font-light tracking-wide">
              BESPOKE SERVICES
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              Experience the art of bespoke tailoring with our personalized services. 
              We craft garments that are meticulously-designed and perfectly fitted 
              to your individual style and preferences.
            </p>
            <div className="pt-4">
              <Link to="/consultation">
                <Button 
                  className="bg-[#1a1a1a] hover:bg-black text-white px-8 py-6 text-lg tracking-wider"
                >
                  Start Your Bespoke Journey
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <img  
              className="w-full aspect-[4/5] object-cover"
              alt="Bespoke tailoring service" 
              src="https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/655a978482238324f447bba1b78f8923.png" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default BespokeServices;
