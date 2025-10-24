
import React from 'react';
import ConsultationChoice from '@/components/consultation/ConsultationChoice';

const ConsultationChoiceStep = ({ onSelect, selectedType }) => {
  return (
    <ConsultationChoice
      onSelect={onSelect}
      selectedType={selectedType}
    />
  );
};

export default ConsultationChoiceStep;
