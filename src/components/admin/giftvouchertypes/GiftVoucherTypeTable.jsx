
import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Plus, ImageOff } from "lucide-react";
import { useGiftVoucherTypes } from "@/context/admin/GiftVoucherTypeContext";
import GiftVoucherTypeDialog from "./GiftVoucherTypeDialog";

const GiftVoucherTypeTable = () => {
  const { voucherTypes, loading, handleOpenDialog, handleDelete } = useGiftVoucherTypes();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Gift Voucher Types</h1>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="w-4 h-4 mr-2" />
          Add New Voucher Type
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {voucherTypes.length === 0 && (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                  No gift voucher types found.
                </td>
              </tr>
            )}
            {voucherTypes.map((voucherType) => (
              <motion.tr
                key={voucherType.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  {voucherType.image_url ? (
                    <img  
                      alt={voucherType.name}
                      class="h-10 w-10 object-cover rounded-md" 
                     src="https://images.unsplash.com/photo-1619698010769-cb2049127251" />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <ImageOff className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{voucherType.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${(voucherType.amount / 100).toLocaleString()}</td>
                <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{voucherType.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voucherType.validity_months} months</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    voucherType.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {voucherType.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenDialog(voucherType)}
                    className="text-indigo-600 hover:text-indigo-900 mr-2"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(voucherType.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      <GiftVoucherTypeDialog />
    </>
  );
};

export default GiftVoucherTypeTable;
