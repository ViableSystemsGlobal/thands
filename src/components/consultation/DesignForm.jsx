
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Ruler, ChevronDown, ChevronUp } from "lucide-react";

const SIZES = ["S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];

const SIZE_GUIDE = {
  S:     { chest: "38",    waist: "30-31" },
  M:     { chest: "40-41", waist: "32-33" },
  L:     { chest: "42-43", waist: "34-35" },
  XL:    { chest: "44",    waist: "36-38" },
  XXL:   { chest: "47",    waist: "39-42" },
  XXXL:  { chest: "50",    waist: "43-45" },
  XXXXL: { chest: "54",    waist: "46-48" },
};

const DesignForm = ({ formData, setFormData, handleFileChange, handleRemoveFile }) => {
  const [showSizeGuide, setShowSizeGuide] = useState(false);

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

      {/* Size Selection */}
      <div className="space-y-2 mt-4">
        <Label>Select Your Size <span className="text-gray-400 text-sm font-normal">(Optional)</span></Label>
        <Select
          value={formData.size || ""}
          onValueChange={(value) => setFormData(prev => ({ ...prev, size: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Choose a size..." />
          </SelectTrigger>
          <SelectContent>
            {SIZES.map(size => (
              <SelectItem key={size} value={size}>{size}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Size Guide */}
      <div className="mt-2">
        <button
          type="button"
          onClick={() => setShowSizeGuide(v => !v)}
          className="flex items-center gap-1.5 text-sm text-[#C19A6B] hover:text-[#A0784A] font-medium"
        >
          <Ruler className="w-4 h-4" />
          {showSizeGuide ? "Hide Size Guide" : "View Size Guide"}
          {showSizeGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {showSizeGuide && (
          <div className="mt-3 border border-amber-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-amber-50">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Size</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Chest (in)</th>
                  <th className="px-4 py-2 text-left font-semibold text-gray-700">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-amber-100">
                {SIZES.map((size, i) => (
                  <tr key={size} className={i % 2 === 0 ? "bg-white" : "bg-amber-50/40"}>
                    <td className="px-4 py-2 font-medium text-gray-800">{size}</td>
                    <td className="px-4 py-2 text-gray-600">{SIZE_GUIDE[size].chest}</td>
                    <td className="px-4 py-2 text-gray-600">{SIZE_GUIDE[size].waist}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 px-4 py-2 bg-gray-50 border-t border-amber-100">
              Measurements are in inches. If between sizes, we recommend sizing up.
            </p>
          </div>
        )}
      </div>

      {/* Measurements Confirmation */}
      <div className={`mt-4 p-4 border rounded-lg ${!formData.measurementsConfirmed ? 'border-amber-200 bg-amber-50' : 'border-green-200 bg-green-50'}`}>
        <div className="flex items-start space-x-2">
          <Checkbox
            id="measurementsConfirmed"
            checked={formData.measurementsConfirmed || false}
            onCheckedChange={(checked) =>
              setFormData(prev => ({ ...prev, measurementsConfirmed: Boolean(checked) }))
            }
          />
          <div>
            <Label htmlFor="measurementsConfirmed" className="text-sm cursor-pointer font-medium">
              I confirm I have reviewed the size guide and selected (or noted) the correct size. *
            </Label>
            <p className="text-xs text-gray-500 mt-1">
              This helps our tailors prepare the perfect fit for you.
            </p>
          </div>
        </div>
      </div>

      {/* Design Images */}
      <div className="space-y-4 mt-4">
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

      {/* Full Photo Upload — Optional */}
      <div className="space-y-4 mt-4">
        <div>
          <Label>Your Full Picture <span className="text-gray-400 text-sm font-normal">(Optional)</span></Label>
          <p className="text-xs text-gray-500 mt-0.5">A full-length photo helps our tailors create the perfect fit for you.</p>
        </div>
        <Input
          type="file"
          accept="image/*"
          multiple
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
      </div>

      <div className="space-y-4 mt-4">
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
