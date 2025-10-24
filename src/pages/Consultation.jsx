
import React, { useState, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { useSettings } from "@/hooks/useSettings";
import ConsultationSteps from "@/components/consultation/ConsultationSteps";
import NameStep from "@/components/consultation/steps/NameStep";
import ContactStep from "@/components/consultation/steps/ContactStep";
import ConsultationChoiceStep from "@/components/consultation/steps/ConsultationChoiceStep";
import AdditionalDetailsStep from "@/components/consultation/steps/AdditionalDetailsStep";
import RecaptchaComponent from "@/components/ui/recaptcha";
import { initialConsultationFormData, handleConsultationSubmit, validateConsultationStep } from "@/lib/consultationUtils";

const ConsultationPage = () => {
  const { toast } = useToast();
  const { settings } = useSettings();
  const [step, setStep] = useState(-1); // Start at -1 to show welcome card first
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialConsultationFormData);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRef = useRef(null);

  const resetFormAndStep = () => {
    setFormData(initialConsultationFormData);
    setStep(-1); // Reset to welcome card
  };

  const stepsConfig = useMemo(() => [
    {
      title: "Your Name",
      component: <NameStep formData={formData} setFormData={setFormData} currentStep={step} validateStep={validateConsultationStep} />,
    },
    {
      title: "Contact Details",
      component: <ContactStep formData={formData} setFormData={setFormData} currentStep={step} validateStep={validateConsultationStep} />,
    },
    {
      title: "Consultation Type",
      component: <ConsultationChoiceStep onSelect={(type) => setFormData({ ...formData, type })} selectedType={formData.type} />,
    },
    {
      title: "Additional Details",
      component: <AdditionalDetailsStep formData={formData} setFormData={setFormData} />,
    },
  ], [formData, step]);


  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaError = (error) => {
    console.error('reCAPTCHA error:', error);
    setRecaptchaToken(null);
    toast({
      title: "reCAPTCHA Error",
      description: "Please complete the reCAPTCHA verification.",
      variant: "destructive",
    });
  };

  const submitForm = async () => {
    if (isSubmitting || !validateConsultationStep(step, formData, stepsConfig.length)) return;
    
    if (settings.captchaEnabled && !recaptchaToken) {
      toast({
        title: "reCAPTCHA Required",
        description: "Please complete the reCAPTCHA verification.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    const success = await handleConsultationSubmit(formData, toast, resetFormAndStep, recaptchaToken);
    if (success) {
       // resetFormAndStep is called within handleConsultationSubmit on success
       if (recaptchaRef.current) {
         recaptchaRef.current.reset();
       }
       setRecaptchaToken(null);
    } else {
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setRecaptchaToken(null);
    }
    setIsSubmitting(false);
  };

  // Welcome Card Component
  const WelcomeCard = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-8"
    >
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-[#D2B48C] rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-light tracking-wide text-gray-800">
          Ready to start your bespoke journey?
        </h1>
        <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
          Experience the art of bespoke tailoring with our personalized consultation. 
          We'll guide you through creating garments that are perfectly fitted to your style and preferences.
        </p>
      </div>
      
      <div className="space-y-4">
        <Button
          onClick={() => setStep(0)}
          className="bg-[#D2B48C] hover:bg-[#C19A6B] text-white px-8 py-6 text-lg tracking-wider rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Start Consultation
        </Button>
        <p className="text-sm text-gray-500">
          Takes about 5 minutes to complete
        </p>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen pt-24 pb-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 max-w-2xl">
        <AnimatePresence mode="wait">
          {step === -1 ? (
            <WelcomeCard />
          ) : (
            <ConsultationSteps
              step={step}
              steps={stepsConfig}
              onNext={() => setStep(step + 1)}
              onBack={() => setStep(step - 1)}
              onSubmit={submitForm}
              isSubmitting={isSubmitting}
              canProceed={() => validateConsultationStep(step, formData, stepsConfig.length)}
              recaptchaRef={recaptchaRef}
              handleRecaptchaChange={handleRecaptchaChange}
              handleRecaptchaError={handleRecaptchaError}
              recaptchaToken={recaptchaToken}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ConsultationPage;
