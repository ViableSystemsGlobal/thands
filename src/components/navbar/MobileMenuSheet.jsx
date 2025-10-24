
import React from 'react';
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import MobileNav from "@/components/navbar/MobileNav";

const MobileMenuSheet = ({ isOpen, onOpenChange, onNavigate }) => {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetTrigger asChild className="md:hidden -ml-2">
        <Button variant="ghost" size="icon" className="mr-2">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <MobileNav onNavigate={onNavigate} />
      </SheetContent>
    </Sheet>
  );
};

export default MobileMenuSheet;
