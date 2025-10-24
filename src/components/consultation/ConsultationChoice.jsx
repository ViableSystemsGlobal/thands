
import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

const ConsultationChoice = ({ onSelect, selectedType }) => {
  const commonCardClasses = "p-8 border rounded-lg cursor-pointer transition-all duration-300 ease-in-out transform hover:scale-105";
  const selectedCardClasses = "border-primary ring-2 ring-primary shadow-xl bg-primary/5";
  const unselectedCardClasses = "border-gray-300 hover:border-gray-500 hover:shadow-md";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      <div 
        className={`${commonCardClasses} ${selectedType === "design" ? selectedCardClasses : unselectedCardClasses}`}
        onClick={() => onSelect("design")}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-800">I have a design</h3>
          {selectedType === "design" && <CheckCircle className="h-6 w-6 text-primary" />}
        </div>
        <p className="text-gray-600">
          Already have your design inspiration? Choose this option to submit your details online.
        </p>
      </div>

      <div 
        className={`${commonCardClasses} ${selectedType === "booking" ? selectedCardClasses : unselectedCardClasses}`}
        onClick={() => onSelect("booking")}
      >
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-800">Book a consultation</h3>
          {selectedType === "booking" && <CheckCircle className="h-6 w-6 text-primary" />}
        </div>
        <p className="text-gray-600">
          Prefer an in-person or video consultation? Schedule a meeting with our expert tailors.
        </p>
      </div>
    </motion.div>
  );
};

export default ConsultationChoice;
