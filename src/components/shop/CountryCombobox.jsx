import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { cn } from "@/lib/utils";

const CountryCombobox = React.forwardRef(({ 
  items = [],
  value = "",
  onChange,
  placeholder = "Select a country",
  className,
  error,
  shippingRules = [],
  allowInternational = false
}, ref) => {
  // Filter out empty strings and prepare items
  const filteredItems = items.filter(item => item !== "");
  
  // Add international option if allowed
  const selectItems = allowInternational 
    ? [{ value: "INTERNATIONAL", label: "International (All Countries)" }, ...filteredItems.map(item => ({ value: item, label: item }))]
    : filteredItems.map(item => ({ value: item, label: item }));

  // Handle the onChange to convert INTERNATIONAL back to empty string
  const handleChange = (selectedValue) => {
    const actualValue = selectedValue === "INTERNATIONAL" ? "" : selectedValue;
    onChange(actualValue);
  };

  // Convert empty string to INTERNATIONAL for display
  const displayValue = value === "" && allowInternational ? "INTERNATIONAL" : value;

  return (
    <div className="relative">
      <Select value={displayValue} onValueChange={handleChange}>
        <SelectTrigger 
          ref={ref}
          className={cn(
            "w-full",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
        >
          {displayValue ? (displayValue === "INTERNATIONAL" ? "International (All Countries)" : displayValue) : placeholder}
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {selectItems.map((item) => (
            <SelectItem 
              key={item.value} 
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
});

CountryCombobox.displayName = "CountryCombobox";

export { CountryCombobox };
