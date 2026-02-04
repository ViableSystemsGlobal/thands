
import React from "react";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import { useCurrency } from "@/context/CurrencyContext";

export const CurrencySelect = () => {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={setCurrency}>
      <SelectTrigger className="w-[100px] md:w-[100px] w-[70px] text-sm md:text-base">
        {currency}
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="USD">USD ($)</SelectItem>
        <SelectItem value="GHS">GHS (₵)</SelectItem>
        <SelectItem value="GBP">GBP (£)</SelectItem>
      </SelectContent>
    </Select>
  );
};
