
import React, { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Group countries by continent
const continentGroups = {
  "Africa": [
    "Ghana", "Nigeria", "South Africa", "Kenya", "Egypt", "Morocco", "Ethiopia",
    "Tanzania", "Algeria", "Uganda"
  ],
  "Asia": [
    "China", "Japan", "India", "South Korea", "Thailand", "Vietnam", "Indonesia",
    "Malaysia", "Singapore", "Philippines"
  ],
  "Europe": [
    "United Kingdom", "Germany", "France", "Italy", "Spain", "Netherlands",
    "Belgium", "Sweden", "Norway", "Denmark"
  ],
  "North America": [
    "United States", "Canada", "Mexico", "Panama", "Costa Rica", "Jamaica",
    "Trinidad and Tobago", "Bahamas", "Cuba", "Dominican Republic"
  ],
  "South America": [
    "Brazil", "Argentina", "Colombia", "Peru", "Chile", "Venezuela", "Ecuador",
    "Bolivia", "Paraguay", "Uruguay"
  ],
  "Oceania": [
    "Australia", "New Zealand", "Fiji", "Papua New Guinea", "Solomon Islands",
    "Vanuatu", "New Caledonia", "Samoa", "Tonga"
  ]
};

const CountrySelector = ({ selected = [], onChange, error }) => {
  const [search, setSearch] = useState("");
  const [expandedContinents, setExpandedContinents] = useState(Object.keys(continentGroups));

  const toggleContinent = (continent) => {
    setExpandedContinents(prev => 
      prev.includes(continent) 
        ? prev.filter(c => c !== continent)
        : [...prev, continent]
    );
  };

  const handleSelectAll = () => {
    const allCountries = Object.values(continentGroups).flat();
    onChange(allCountries);
  };

  const handleClearAll = () => {
    onChange([]);
  };

  const toggleCountry = (country) => {
    onChange(
      selected.includes(country)
        ? selected.filter(c => c !== country)
        : [...selected, country]
    );
  };

  const filteredGroups = Object.entries(continentGroups).reduce((acc, [continent, countries]) => {
    const filteredCountries = countries.filter(country =>
      country.toLowerCase().includes(search.toLowerCase())
    );
    if (filteredCountries.length > 0) {
      acc[continent] = filteredCountries;
    }
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      <Command className="rounded-lg border">
        <div className="flex items-center gap-2 p-2 border-b">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            Select All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleClearAll}
            className="text-xs"
          >
            Clear All
          </Button>
        </div>
        <CommandInput
          placeholder="Search countries..."
          value={search}
          onValueChange={setSearch}
          className="border-none focus:ring-0"
        />
        <CommandEmpty>No countries found.</CommandEmpty>
        <div className="max-h-[300px] overflow-y-auto">
          {Object.entries(filteredGroups).map(([continent, countries]) => (
            <div key={continent}>
              <button
                type="button"
                onClick={() => toggleContinent(continent)}
                className={cn(
                  "flex items-center w-full px-2 py-1.5 text-sm font-medium",
                  "hover:bg-accent hover:text-accent-foreground",
                  "transition-colors"
                )}
              >
                <span className="mr-2">
                  {expandedContinents.includes(continent) ? "▼" : "▶"}
                </span>
                {continent} ({countries.length})
              </button>
              {expandedContinents.includes(continent) && (
                <CommandGroup>
                  {countries.map((country) => (
                    <CommandItem
                      key={country}
                      onSelect={() => toggleCountry(country)}
                      className="pl-6 cursor-pointer"
                    >
                      <div className="flex items-center">
                        <div
                          className={cn(
                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                            selected.includes(country)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-input"
                          )}
                        >
                          {selected.includes(country) && (
                            <Check className="h-3 w-3" />
                          )}
                        </div>
                        {country}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </div>
          ))}
        </div>
      </Command>
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {selected.map(country => (
            <span
              key={country}
              className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary"
            >
              {country}
              <button
                type="button"
                onClick={() => toggleCountry(country)}
                className="ml-1 hover:text-primary/70"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
