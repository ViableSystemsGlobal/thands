
import * as React from "react";
import { X, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MultiSelect = React.forwardRef(({ 
  items = [],
  selected = [],
  onChange,
  placeholder = "Select options...",
  className,
  searchPlaceholder = "Search...",
}, ref) => {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    return items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSelect = (item) => {
    const newSelected = selected.includes(item)
      ? selected.filter((i) => i !== item)
      : [...selected, item];
    onChange(newSelected);
    // Removed setOpen(false) to keep dropdown open
  };

  const handleSelectAll = () => {
    onChange(items);
    // Keep dropdown open after selecting all
  };

  const handleClearAll = () => {
    onChange([]);
    // Keep dropdown open after clearing
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          ref={ref}
        >
          <span className="truncate">
            {selected.length === 0
              ? placeholder
              : selected.length === 1
              ? selected[0]
              : `${selected.length} selected`}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder={searchPlaceholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup>
            <div className="flex items-center justify-between p-2 border-b sticky top-0 bg-white z-10">
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleSelectAll}
                type="button"
              >
                Select All
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={handleClearAll}
                type="button"
              >
                Clear All
              </Button>
            </div>
            <div className="max-h-[200px] overflow-y-auto">
              {filteredItems.map((item) => (
                <CommandItem
                  key={item}
                  value={item}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border",
                        selected.includes(item)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {selected.includes(item) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    {item}
                  </div>
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
