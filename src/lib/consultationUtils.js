import { api } from "@/lib/services/api";
import { TOAST_MESSAGES } from "@/lib/toast-messages";

export const initialConsultationFormData = {
  name: "",
  email: "",
  phone: "",
  whatsappPhone: "",
  type: "", // 'design' or 'booking'
  height: "",
  designs: [],
  photos: [],
  additionalInstructions: "",
  preferredDate: "",
  preferredTime: "",
  consultationType: "", // 'video' or 'office'
  consultationInstructions: "",
};

export const uploadFile = async (file, folder) => {
  // For now, return a mock URL to prevent errors
  // TODO: Implement proper file upload to local server
  return `mock-upload-url-${Date.now()}`;
};

export const handleConsultationSubmit = async (formData, toast, resetForm, recaptchaToken = null) => {
  try {
    let designUrls = [];
    let photoUrls = [];

    if (formData.type === "design") {
      for (const design of formData.designs) {
        const url = await uploadFile(design, "consultations/designs");
        designUrls.push(url);
      }
      for (const photo of formData.photos) {
        const url = await uploadFile(photo, "consultations/photos");
        photoUrls.push(url);
      }
    }

    const submissionData = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      whatsapp_phone: formData.whatsappPhone,
      type: formData.type,
      height: formData.type === "design" ? formData.height : null,
      design_urls: designUrls.length > 0 ? designUrls : null,
      photo_urls: photoUrls.length > 0 ? photoUrls : null,
      additional_instructions: formData.type === "design" ? formData.additionalInstructions : null,
      preferred_date: formData.type === "booking" ? formData.preferredDate : null,
      preferred_time: formData.type === "booking" ? formData.preferredTime : null,
      consultation_type: formData.type === "booking" ? formData.consultationType : null,
      consultation_instructions: formData.type === "booking" ? formData.consultationInstructions : null,
      recaptcha_token: recaptchaToken,
      status: "pending",
    };

    const response = await api.post('/consultations', submissionData);

    if (!response.success) {
      throw new Error(response.error || 'Failed to submit consultation');
    }

    toast({
      title: "Success!",
      description: TOAST_MESSAGES.consultation.submit.success,
      variant: "success",
    });

    resetForm();
    return true; 
  } catch (error) {
    console.error("Error submitting form:", error);
    toast({
      title: "Error",
      description: TOAST_MESSAGES.consultation.submit.error + (error.message ? `: ${error.message}` : ''),
      variant: "destructive",
    });
    return false;
  }
};

export const validateConsultationStep = (step, formData) => {
  switch (step) {
    case 1:
      return formData.name.trim() !== "";
    case 2:
      return formData.email.trim() !== "" && formData.phone.trim() !== "";
    case 3:
      return formData.type !== "";
    case 4:
      if (formData.type === "design") {
        return formData.height.trim() !== "";
      } else if (formData.type === "booking") {
        return formData.preferredDate !== "" && formData.preferredTime !== "" && formData.consultationType !== "";
      }
      return true;
    default:
      return true;
  }
};