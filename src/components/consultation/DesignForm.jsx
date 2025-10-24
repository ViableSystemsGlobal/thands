
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const DesignForm = ({ formData, setFormData, handleFileChange, handleRemoveFile }) => {
  return (
    <>
      <div className="space-y-4">
        <Label>Height</Label>
        <Input
          type="text"
          required
          placeholder="e.g., 5 feet 8 inches or 173cm"
          value={formData.height}
          onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
        />
      </div>

      <div className="space-y-4">
        <Label>Share image/screenshots of the design</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, "designs")}
        />
        <div className="grid grid-cols-2 gap-4">
          {formData.designs.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile("designs", index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label>Your Full Picture (3 minimum)</Label>
        <Input
          type="file"
          accept="image/*"
          multiple
          required={formData.photos.length < 3}
          onChange={(e) => handleFileChange(e, "photos")}
        />
        <div className="grid grid-cols-2 gap-4">
          {formData.photos.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile("photos", index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
        {formData.photos.length < 3 && (
          <p className="text-sm text-red-500">Please upload at least 3 photos</p>
        )}
      </div>

      <div className="space-y-4">
        <Label>Additional Instructions</Label>
        <textarea
          className="w-full p-2 border rounded-md min-h-[100px]"
          value={formData.additionalInstructions}
          onChange={(e) => setFormData(prev => ({ ...prev, additionalInstructions: e.target.value }))}
          placeholder="Any specific requirements, preferences, or your measurements (e.g., chest, waist, hips, inseam)..."
        />
      </div>
    </>
  );
};

export default DesignForm;
