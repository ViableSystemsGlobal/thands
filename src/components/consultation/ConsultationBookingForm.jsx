
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ConsultationBookingForm = ({ formData, setFormData }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="consultation-type-select">Consultation Method</Label>
        <Select
          value={formData.consultationType}
          onValueChange={(value) => setFormData(prev => ({ ...prev, consultationType: value }))}
        >
          <SelectTrigger id="consultation-type-select" className="w-full">
            <SelectValue placeholder="Select consultation method" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video">Video Call</SelectItem>
            <SelectItem value="office">Visit Our Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred-date">Preferred Date</Label>
        <Input
          id="preferred-date"
          type="date"
          required
          value={formData.preferredDate}
          onChange={(e) => setFormData(prev => ({ ...prev, preferredDate: e.target.value }))}
          min={new Date().toISOString().split('T')[0]}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="preferred-time">Preferred Time</Label>
        <Input
          id="preferred-time"
          type="time"
          required
          value={formData.preferredTime}
          onChange={(e) => setFormData(prev => ({ ...prev, preferredTime: e.target.value }))}
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="consultation-instructions">Special Instructions or Requirements</Label>
        <Textarea
          id="consultation-instructions"
          className="w-full min-h-[120px]"
          value={formData.consultationInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, consultationInstructions: e.target.value }))}
          placeholder="Please share any specific requirements, questions, preferences for your consultation, or your measurements (e.g., chest, waist, hips, inseam)..."
        />
      </div>
    </div>
  );
};

export default ConsultationBookingForm;
