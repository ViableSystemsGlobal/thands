
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useGiftVoucherTypes } from "@/context/admin/GiftVoucherTypeContext";

const GiftVoucherTypeDialog = () => {
  const {
    isDialogOpen,
    handleCloseDialog,
    editingVoucherType,
    formData,
    setFormData,
    handleSubmit,
  } = useGiftVoucherTypes();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
      <DialogContent className="sm:max-w-[525px] bg-white rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">
            {editingVoucherType ? "Edit Gift Voucher Type" : "Add New Gift Voucher Type"}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Fill in the details for the gift voucher type.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit();
          }}
          className="grid gap-6 py-6 px-2"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right text-sm font-medium text-gray-700">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right text-sm font-medium text-gray-700">
              Amount ($)
            </Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.amount}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right text-sm font-medium text-gray-700">
              Description
            </Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="col-span-3 min-h-[80px]"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="validity_months" className="text-right text-sm font-medium text-gray-700">
              Validity (Months)
            </Label>
            <Input
              id="validity_months"
              name="validity_months"
              type="number"
              min="1"
              value={formData.validity_months}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image_url" className="text-right text-sm font-medium text-gray-700">
              Image URL
            </Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              className="col-span-3"
              placeholder="https://example.com/image.png"
            />
          </div>
           <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="is_active" className="text-right text-sm font-medium text-gray-700">
              Active
            </Label>
            <div className="col-span-3 flex items-center">
              <Checkbox
                id="is_active"
                name="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={handleCloseDialog} className="mr-2">
              Cancel
            </Button>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-white">
              {editingVoucherType ? "Update Voucher Type" : "Create Voucher Type"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default GiftVoucherTypeDialog;
