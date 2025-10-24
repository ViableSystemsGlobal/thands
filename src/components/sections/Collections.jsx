
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useShop } from "@/context/ShopContext";
import { api } from "@/lib/services/api";

const Collections = () => {
  const navigate = useNavigate();
  const { setSearchQuery } = useShop();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Default fallback collections
  const defaultCollections = [
    {
      id: 1,
      name: "Kaftan",
      description: "Explore our collection of elegant kaftans",
      image_url: "https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/fa019d4560e5a2e09dc05211ac6fcb00.jpg",
      search_terms: ["kaftan", "kaftans"],
      is_active: true,
      sort_order: 1
    },
    {
      id: 2,
      name: "Casual Wear",
      description: "Explore our casual wear collection",
      image_url: "https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc6e91ffdbb67de6a4d6ac4baf0ce080.png",
      search_terms: ["casual", "casual wear"],
      is_active: true,
      sort_order: 2
    },
    {
      id: 3,
      name: "Agbada",
      description: "Discover our regal Agbada collection",
      image_url: "https://storage.googleapis.com/hostinger-horizons-assets-prod/3a44a4a9-7b05-4768-be68-8eeb55d662d7/cc0ba00c0ee5afba16f73e4f65191966.png",
      search_terms: ["agbada", "grand boubou"],
      is_active: true,
      sort_order: 3
    }
  ];

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const response = await api.get('/collections/public/active');

      if (response.success && response.data && response.data.length > 0) {
        setCollections(response.data);
      } else {
        // No collections in database, use defaults
        setCollections(defaultCollections);
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections(defaultCollections);
    } finally {
      setLoading(false);
    }
  };

  const handleCollectionClick = (collection) => {
    const searchTerms = collection.search_terms || [collection.name.toLowerCase()];
    const searchQuery = searchTerms.join("|");
    setSearchQuery(searchQuery);
    navigate(`/shop?search=${encodeURIComponent(searchQuery)}`);
  };

  if (loading) {
    return (
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading collections...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-4xl font-light text-center mb-12"
        >
          Our Collections
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="group cursor-pointer"
              onClick={() => handleCollectionClick(collection)}
            >
              <div className="block">
                <div className="aspect-[3/4] mb-4 overflow-hidden rounded-lg">
                  <img  
                    alt={`${collection.name} collection`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    src={collection.image_url ? `${collection.image_url}?size=medium` : "https://via.placeholder.com/400x600?text=Collection+Image"}
                  />
                </div>
                <h3 className="text-xl font-medium mb-2">{collection.name}</h3>
                <p className="text-gray-600">{collection.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Collections;
