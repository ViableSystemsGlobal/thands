
import React from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const FAQ = () => {
  const faqs = [
    {
      question: "What is bespoke tailoring?",
      answer: "Bespoke tailoring is the creation of custom-fitted clothing made specifically for an individual. Unlike ready-to-wear or made-to-measure garments, bespoke pieces are crafted from scratch according to your exact measurements and preferences."
    },
    {
      question: "How long does it take to create a bespoke piece?",
      answer: "The creation of a bespoke piece typically takes 2-3 weeks from consultation to final fitting. This includes initial measurements, fabric selection, fittings, and final adjustments to ensure the perfect fit."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we offer worldwide shipping. Shipping costs and delivery times vary depending on your location. You can view specific shipping details during checkout."
    },
    {
      question: "What is your return policy?",
      answer: "We accept returns within 14 days of delivery for ready-to-wear items in their original condition with tags attached. Bespoke and custom-made items cannot be returned unless there is a fault in craftsmanship."
    },
    {
      question: "Can I modify my order after placing it?",
      answer: "For ready-to-wear items, you can modify your order within 24 hours of placing it. For bespoke orders, modifications can be discussed during the fitting process."
    },
    {
      question: "Do you offer gift wrapping?",
      answer: "Yes, we offer complimentary gift wrapping services. You can select this option during checkout and include a personalized message."
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-light mb-6 font-serif tracking-wide">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find answers to common questions about our services, ordering process, and policies.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Dialog>
                <DialogTrigger asChild>
                  <button className="w-full text-left p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                    <h3 className="text-lg font-medium mb-2">{faq.question}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{faq.answer}</p>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{faq.question}</DialogTitle>
                  </DialogHeader>
                  <div className="mt-4">
                    <p className="text-gray-600">{faq.answer}</p>
                  </div>
                </DialogContent>
              </Dialog>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
