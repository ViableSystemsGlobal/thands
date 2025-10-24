
import React from "react";
import Hero from "@/components/sections/Hero";
import Collections from "@/components/sections/Collections";
import FeaturedProducts from "@/components/sections/FeaturedProducts";
import BespokeServices from "@/components/sections/BespokeServices";
import SocialMediaFeed from "@/components/sections/SocialMediaFeed";
import FAQ from "@/components/sections/FAQ";

const Home = () => {
  return (
    <div className="min-h-screen">
      <Hero />
      <Collections />
      <FeaturedProducts />
      <BespokeServices />
      <FAQ />
      <SocialMediaFeed />
    </div>
  );
};

export default Home;
