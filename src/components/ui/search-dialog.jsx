
import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, Search as SearchIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/context/ShopContext";
import { useNavigate } from "react-router-dom";

const SearchDialog = () => {
  const { searchQuery, setSearchQuery, isSearchOpen, setIsSearchOpen } = useShop();
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <Dialog.Root open={isSearchOpen} onOpenChange={setIsSearchOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50" />
        <Dialog.Content className="fixed left-[50%] top-[10%] z-50 w-full max-w-2xl translate-x-[-50%] translate-y-[-10%] rounded-lg bg-white p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <SearchIcon className="absolute left-4 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search products..."
              className="w-full rounded-md border border-gray-200 py-2 pl-12 pr-4 text-sm outline-none focus:border-[#1A1A1A]"
              autoFocus
            />
            <Dialog.Close className="absolute right-2 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-gray-100">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Dialog.Close>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SearchDialog;
