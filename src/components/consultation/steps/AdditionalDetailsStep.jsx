
import React from 'react';
import DesignForm from '@/components/consultation/DesignForm';
import ConsultationBookingForm from '@/components/consultation/ConsultationBookingForm';

const AdditionalDetailsStep = ({ formData, setFormData }) => {
  if (formData.type === "design") {
    return (
      <DesignForm
        formData={formData}
        setFormData={setFormData}
        handleFileChange={(e, fileType) => {
          const files = Array.from(e.target.files || []);
          setFormData(prev => ({ ...prev, [fileType]: [...prev[fileType], ...files] }));
        }}
        handleRemoveFile={(fileType, index) => {
          setFormData(prev => ({
            ...prev,
            [fileType]: prev[fileType].filter((_, i) => i !== index),
          }));
        }}
      />
    );
  }
  
  if (formData.type === "booking") {
    return (
      <ConsultationBookingForm
        formData={formData}
        setFormData={setFormData}
      />
    );
  }

  return <p className="text-center text-gray-500">Please select a consultation type in the previous step.</p>;
};

export default AdditionalDetailsStep;
