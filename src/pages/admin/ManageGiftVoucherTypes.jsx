
import React from "react";
import GiftVoucherTypeTable from "@/components/admin/giftvouchertypes/GiftVoucherTypeTable";
import { GiftVoucherTypeProvider } from "@/context/admin/GiftVoucherTypeContext";

const ManageGiftVoucherTypes = () => {
  return (
    <GiftVoucherTypeProvider>
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <h1 className="text-3xl md:text-4xl font-light text-slate-800 mb-8">Manage Gift Voucher Types</h1>
        <GiftVoucherTypeTable />
      </div>
    </GiftVoucherTypeProvider>
  );
};

export default ManageGiftVoucherTypes;
