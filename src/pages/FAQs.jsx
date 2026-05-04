import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { fetchAllPublicFAQs } from "@/lib/db/faqs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadFAQs = async () => {
      setLoading(true);
      setError("");

      const { data, error: fetchError } = await fetchAllPublicFAQs();
      if (fetchError) {
        setError("Unable to load FAQs right now. Please try again shortly.");
        setFaqs([]);
      } else {
        setFaqs(Array.isArray(data) ? data : []);
      }

      setLoading(false);
    };

    loadFAQs();
  }, []);

  const groupedFAQs = useMemo(() => {
    const groups = { General: [] };

    faqs.forEach((faq) => {
      const productName = faq.products?.name;
      const groupName = productName || "General";

      if (!groups[groupName]) {
        groups[groupName] = [];
      }

      groups[groupName].push(faq);
    });

    return groups;
  }, [faqs]);

  return (
    <main className="pt-28 pb-16 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-light mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-600">
            Browse answers added by our admin team across general and product-specific topics.
          </p>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-600">{error}</div>
        ) : faqs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">No FAQs available yet.</div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([groupName, groupItems]) => {
              if (!groupItems.length) return null;

              return (
                <section key={groupName} className="bg-white rounded-xl shadow-sm border p-5 sm:p-6">
                  <h2 className="text-2xl font-medium mb-4">{groupName}</h2>
                  <Accordion type="single" collapsible className="w-full">
                    {groupItems.map((faq) => (
                      <AccordionItem key={faq.id} value={`faq-${faq.id}`}>
                        <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-gray-700 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default FAQs;
