import React from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIssuedGiftVouchers } from "@/context/admin/IssuedGiftVoucherContext";
import { useCurrency } from "@/context/CurrencyContext"; 
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, Download, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const IssuedGiftVoucherTable = ({ 
  selectedVouchers,
  onSelectVoucher,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  onDeleteVoucher,
  onBulkDelete,
  onBulkExport,
  onClearSelection
}) => {
  const { issuedVouchers, loading, filters, setFilters, updateVoucherStatus } = useIssuedGiftVouchers();
  const { formatPrice } = useCurrency();

  const handleFilterChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };
  
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      case 'depleted': return 'bg-yellow-500';
      case 'inactive': return 'bg-gray-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-gray-800">Issued Gift Vouchers</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Input
            placeholder="Search by code, email, name..."
            value={filters.searchTerm}
            onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
            className="w-full sm:w-64"
          />
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="depleted">Depleted</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <BulkActionsBar
        selectedCount={selectedVouchers?.length || 0}
        onBulkDelete={onBulkDelete}
        onBulkExport={onBulkExport}
        onClearSelection={onClearSelection}
      />

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="w-full min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initial Value</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchaser</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expires At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Voucher Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
                  Loading vouchers...
                </td>
              </tr>
            )}
            {!loading && issuedVouchers.length === 0 && (
              <tr>
                <td colSpan="10" className="px-6 py-12 text-center text-gray-500">
                  No issued gift vouchers found.
                </td>
              </tr>
            )}
            {!loading && issuedVouchers.map((voucher) => (
              <motion.tr
                key={voucher.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`hover:bg-gray-50 transition-colors ${selectedVouchers?.includes(voucher.id) ? 'bg-blue-50' : ''}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <Checkbox
                    checked={selectedVouchers?.includes(voucher.id) || false}
                    onCheckedChange={(checked) => onSelectVoucher(voucher.id, checked)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-indigo-600">{voucher.code}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">{formatPrice(voucher.amount / 100, true, "USD")}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPrice(voucher.initial_amount / 100, true, "USD")}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge className={`${getStatusColor(voucher.status)} text-white`}>{voucher.status}</Badge>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voucher.recipient_name || "N/A"}<br/>
                  <span className="text-xs text-gray-400">{voucher.recipient_email || ""}</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {voucher.purchaser_name || "N/A"}<br/>
                  <span className="text-xs text-gray-400">{voucher.purchaser_email || ""}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {voucher.expires_at ? new Date(voucher.expires_at).toLocaleDateString() : "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{voucher.gift_voucher_types?.name || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <div className="flex space-x-2">
                    {voucher.status === 'active' && (
                      <button 
                        onClick={() => updateVoucherStatus(voucher.id, 'inactive')}
                        className="text-xs text-red-600 hover:text-red-800 hover:underline"
                      >
                        Deactivate
                      </button>
                    )}
                    {voucher.status === 'inactive' && (
                       <button 
                        onClick={() => updateVoucherStatus(voucher.id, 'active')}
                        className="text-xs text-green-600 hover:text-green-800 hover:underline"
                      >
                        Activate
                      </button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteVoucher(voucher)}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      title="Delete Gift Voucher"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

const BulkActionsBar = ({ selectedCount, onBulkDelete, onBulkExport, onClearSelection }) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 flex items-center justify-between"
    >
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-blue-800">
          {selectedCount} gift voucher{selectedCount > 1 ? 's' : ''} selected
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="text-blue-600 border-blue-300 hover:bg-blue-100"
        >
          Clear Selection
        </Button>
      </div>
      
      <div className="flex items-center space-x-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-100">
              <MoreHorizontal className="h-4 w-4 mr-2" />
              Bulk Actions
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onBulkExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onBulkDelete} className="text-red-600">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
};

export default IssuedGiftVoucherTable;
