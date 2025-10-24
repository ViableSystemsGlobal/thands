import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV } from "@/lib/export";
import IssuedGiftVoucherTable from "@/components/admin/issuedgiftvouchers/IssuedGiftVoucherTable";
import { IssuedGiftVoucherProvider, useIssuedGiftVouchers } from "@/context/admin/IssuedGiftVoucherContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const IssuedGiftVouchersContent = () => {
  const { toast } = useToast();
  const { issuedVouchers, deleteVoucher, deleteBulkVouchers } = useIssuedGiftVouchers();
  
  // Selection state
  const [selectedVouchers, setSelectedVouchers] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [voucherToDelete, setVoucherToDelete] = useState(null);

  // Update selection state when vouchers change
  useEffect(() => {
    if (issuedVouchers.length === 0) {
      setSelectedVouchers([]);
      setIsAllSelected(false);
      setIsIndeterminate(false);
      return;
    }

    const validSelectedVouchers = selectedVouchers.filter(id => 
      issuedVouchers.some(voucher => voucher.id === id)
    );
    
    if (validSelectedVouchers.length !== selectedVouchers.length) {
      setSelectedVouchers(validSelectedVouchers);
    }

    const allSelected = validSelectedVouchers.length === issuedVouchers.length && issuedVouchers.length > 0;
    const someSelected = validSelectedVouchers.length > 0 && validSelectedVouchers.length < issuedVouchers.length;
    
    setIsAllSelected(allSelected);
    setIsIndeterminate(someSelected);
  }, [issuedVouchers, selectedVouchers]);

  // Selection handlers
  const handleSelectVoucher = (id, checked) => {
    if (checked) {
      setSelectedVouchers([...selectedVouchers, id]);
    } else {
      setSelectedVouchers(selectedVouchers.filter(voucherId => voucherId !== id));
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedVouchers([]);
    } else {
      setSelectedVouchers(issuedVouchers.map(voucher => voucher.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedVouchers([]);
  };

  const handleDeleteVoucher = (voucher) => {
    setVoucherToDelete(voucher);
    setShowDeleteDialog(true);
  };

  const confirmDeleteVoucher = async () => {
    if (voucherToDelete) {
      await deleteVoucher(voucherToDelete.id);
      setShowDeleteDialog(false);
      setVoucherToDelete(null);
      // Clear selection if deleted voucher was selected
      setSelectedVouchers(prev => prev.filter(id => id !== voucherToDelete.id));
    }
  };

  const handleBulkExport = async () => {
    const selectedVoucherData = issuedVouchers
      .filter(voucher => selectedVouchers.includes(voucher.id))
      .map(voucher => ({
        Code: voucher.code,
        CurrentValue: voucher.amount / 100,
        InitialValue: voucher.initial_amount / 100,
        Status: voucher.status,
        RecipientName: voucher.recipient_name || 'N/A',
        RecipientEmail: voucher.recipient_email || 'N/A',
        PurchaserName: voucher.purchaser_name || 'N/A',
        PurchaserEmail: voucher.purchaser_email || 'N/A',
        ExpiresAt: voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : 'N/A',
        VoucherType: voucher.gift_voucher_types?.name || 'N/A',
        PurchasedAt: voucher.purchased_at ? new Date(voucher.purchased_at).toLocaleDateString() : 'N/A'
      }));

    exportToCSV(selectedVoucherData, `gift_vouchers_${new Date().toISOString().split('T')[0]}`);
    toast({
      title: "Export Successful",
      description: `${selectedVouchers.length} gift voucher${selectedVouchers.length > 1 ? 's' : ''} exported successfully.`,
    });
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    if (selectedVouchers.length > 0) {
      await deleteBulkVouchers(selectedVouchers);
      setSelectedVouchers([]);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <h1 className="text-3xl md:text-4xl font-light text-slate-800 mb-8">Issued Gift Vouchers</h1>
        <IssuedGiftVoucherTable 
          selectedVouchers={selectedVouchers}
          onSelectVoucher={handleSelectVoucher}
          onSelectAll={handleSelectAll}
          isAllSelected={isAllSelected}
          isIndeterminate={isIndeterminate}
          onDeleteVoucher={handleDeleteVoucher}
          onBulkDelete={handleBulkDelete}
          onBulkExport={handleBulkExport}
          onClearSelection={handleClearSelection}
        />
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {voucherToDelete ? 'Delete Gift Voucher' : 'Delete Selected Gift Vouchers'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {voucherToDelete 
                ? `Are you sure you want to delete the gift voucher "${voucherToDelete.code}"? This action cannot be undone.`
                : `Are you sure you want to delete ${selectedVouchers.length} selected gift voucher${selectedVouchers.length > 1 ? 's' : ''}? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setShowDeleteDialog(false);
              setVoucherToDelete(null);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={voucherToDelete ? confirmDeleteVoucher : confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

const IssuedGiftVouchers = () => {
  return (
    <IssuedGiftVoucherProvider>
      <IssuedGiftVouchersContent />
    </IssuedGiftVoucherProvider>
  );
};

export default IssuedGiftVouchers;
