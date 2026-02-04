
import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

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
    if (!searchQuery) return items;
    return items.filter(item =>
      item.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [items, searchQuery]);

  const handleSelect = React.useCallback((item, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    console.log('🔵 MultiSelect: handleSelect called with:', item);
    const newSelected = selected.includes(item)
      ? selected.filter((i) => i !== item)
      : [...selected, item];
    console.log('🔵 MultiSelect: newSelected:', newSelected);
    onChange(newSelected);
  }, [selected, onChange]);

  const handleSelectAll = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(items);
  }, [items, onChange]);

  const handleClearAll = React.useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange([]);
  }, [onChange]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          ref={ref}
          type="button"
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
      <PopoverContent 
        className="w-[300px] p-0 overflow-visible" 
        align="start"
        sideOffset={4}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onPointerDownOutside={(e) => {
          // Don't close if clicking on items inside
          const target = e.target;
          if (target && (target.closest('[role="button"]') || target.closest('.cursor-pointer'))) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Allow escape to close
        }}
      >
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3 py-2 flex-shrink-0">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          
          {/* Select All / Clear All */}
          <div className="flex items-center justify-between p-2 border-b bg-gray-50 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleSelectAll}
              type="button"
            >
              Select All
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7"
              onClick={handleClearAll}
              type="button"
            >
              Clear All
            </Button>
          </div>
          
          {/* Items List */}
          <div 
            className="p-1" 
            style={{ 
              height: '300px',
              overflowY: 'scroll',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              scrollbarWidth: 'thin'
            }}
          >
            {filteredItems.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No results found.
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item}
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🟢 MultiSelect: Item clicked:', item);
                    handleSelect(item, e);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSelect(item, e);
                    }
                  }}
                  className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                >
                  <div className="flex items-center w-full">
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border transition-colors",
                        selected.includes(item)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-input"
                      )}
                    >
                      {selected.includes(item) && (
                        <Check className="h-3 w-3 text-white" />
                      )}
                    </div>
                    <span>{item}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
