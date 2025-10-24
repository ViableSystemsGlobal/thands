
import React, { useState } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const CountryCombobox = React.forwardRef(({ 
  items = [],
  value = "",
  onChange,
  placeholder = "Search countries...",
  className,
  error
}, ref) => {
  const [search, setSearch] = useState("");

  const filteredItems = items.filter((item) =>
    item.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <Command
        ref={ref}
        className={cn(
          "w-full rounded-md border border-input bg-background text-sm ring-offset-background overflow-hidden",
          error && "border-red-500 focus-within:border-red-500",
          className
        )}
      >
        <div className="flex items-center border-b px-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground/50" />
          <CommandInput
            value={search}
            onValueChange={setSearch}
            placeholder={placeholder}
            className="h-10 flex-1 border-0 outline-none focus:ring-0 bg-transparent"
          />
        </div>
        <CommandEmpty className="py-6 text-center text-sm">
          No country found.
        </CommandEmpty>
        <CommandGroup className="max-h-[200px] overflow-y-auto p-1">
          {filteredItems.map((item) => (
            <CommandItem
              key={item}
              value={item}
              onSelect={() => {
                onChange(item);
                setSearch("");
              }}
              className="flex items-center gap-2 px-2 py-1.5 cursor-pointer aria-selected:bg-accent"
            >
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded-sm border",
                value === item ? "bg-primary border-primary text-primary-foreground" : "border-input"
              )}>
                {value === item && <Check className="h-3 w-3" />}
              </div>
              <span className={cn(
                "flex-1",
                value === item && "font-medium"
              )}>
                {item}
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </Command>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
      {value && (
        <div className="mt-2">
          <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-primary/10 text-primary">
            {value}
            <button
              type="button"
              onClick={() => onChange("")}
              className="ml-1 hover:text-primary/70"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

CountryCombobox.displayName = "CountryCombobox";

export { CountryCombobox };
