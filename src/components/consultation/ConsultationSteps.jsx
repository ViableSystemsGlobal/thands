
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RecaptchaComponent from "@/components/ui/recaptcha";

const ConsultationSteps = ({ 
  step, 
  steps, 
  formData, 
  setFormData, 
  onNext, 
  onBack, 
  onSubmit, 
  isSubmitting, 
  canProceed,
  recaptchaRef,
  handleRecaptchaChange,
  handleRecaptchaError,
  recaptchaToken
}) => {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-lg p-8"
    >
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          {step > 0 && (
            <div className="text-sm text-gray-500">
              Step {step} of {steps.length - 1}
            </div>
          )}
          <div className="h-1 flex-1 bg-gray-200 rounded-full ml-4">
            <div
              className="h-1 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
            />
          </div>
        </div>
        <h2 className="text-2xl font-serif mb-2">{steps[step].title}</h2>
        {steps[step].description && (
          <p className="text-gray-600">{steps[step].description}</p>
        )}
      </div>

      {steps[step].component}

      {/* Show reCAPTCHA on the final step */}
      {step === steps.length - 1 && (
        <div className="mt-6">
          <RecaptchaComponent
            ref={recaptchaRef}
            onChange={handleRecaptchaChange}
            onError={handleRecaptchaError}
            className="mt-2"
          />
        </div>
      )}

      <div className="mt-8 flex gap-4">
        {step > 0 && (
          <Button
            variant="outline"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button
            onClick={onNext}
            disabled={!canProceed()}
            className="flex-1"
          >
            Continue
          </Button>
        ) : (
          <Button
            onClick={onSubmit}
            disabled={isSubmitting || !canProceed() || !recaptchaToken}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ConsultationSteps;
