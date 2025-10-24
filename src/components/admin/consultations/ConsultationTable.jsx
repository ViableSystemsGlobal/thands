import React from 'react';
import { motion } from "framer-motion";
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, Loader2, AlertTriangle, Trash2, Download, MoreHorizontal } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PaginationControls from "@/components/admin/PaginationControls";

const getStatusBadgeVariant = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-yellow-400 hover:bg-yellow-500';
    case 'confirmed': return 'bg-blue-500 hover:bg-blue-600';
    case 'completed': return 'bg-green-500 hover:bg-green-600';
    case 'cancelled': return 'bg-red-500 hover:bg-red-600';
    default: return 'bg-gray-400 hover:bg-gray-500';
  }
};

const ConsultationTable = ({ 
  consultations, 
  onUpdateStatus, 
  onViewDetails, 
  onDeleteConsultation,
  loading,
  initialLoading,
  currentPage,
  totalPages,
  onPageChange,
  itemsPerPage,
  totalItems,
  onItemsPerPageChange,
  selectedConsultations,
  onSelectConsultation,
  onSelectAll,
  isAllSelected,
  isIndeterminate,
  onBulkDelete,
  onBulkExport,
  onClearSelection
}) => {
  if (initialLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-600">Loading consultations...</p>
      </div>
    );
  }
  
  if (loading && consultations.length === 0 && !initialLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-2 text-gray-600">Fetching consultations...</p>
      </div>
    );
  }

  if (!loading && consultations.length === 0) {
    return (
      <div className="text-center py-10">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Consultations Found</h3>
        <p className="mt-1 text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  return (
    <>
      <BulkActionsBar
        selectedCount={selectedConsultations?.length || 0}
        onBulkDelete={onBulkDelete}
        onBulkExport={onBulkExport}
        onClearSelection={onClearSelection}
      />
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate;
                  }}
                />
              </TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Name</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Email</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Phone</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Date Submitted</TableHead>
              <TableHead className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="bg-white divide-y divide-slate-200">
            {consultations.map((consultation) => (
              <TableRow key={consultation.id} className={`hover:bg-slate-50 transition-colors ${selectedConsultations?.includes(consultation.id) ? 'bg-blue-50' : ''}`}>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm">
                  <Checkbox
                    checked={selectedConsultations?.includes(consultation.id) || false}
                    onCheckedChange={(checked) => onSelectConsultation(consultation.id, checked)}
                  />
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{consultation.name}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{consultation.email}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{consultation.phone}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{consultation.type}</TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  <Select
                    value={consultation.status || "pending"}
                    onValueChange={(newStatus) => onUpdateStatus(consultation.id, newStatus)}
                  >
                    <SelectTrigger className={`w-[130px] h-8 text-xs border-none rounded-md focus:ring-0 ${getStatusBadgeVariant(consultation.status)} text-white`}>
                       <SelectValue placeholder="Set status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                  {new Date(consultation.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onViewDetails(consultation)}
                      className="text-blue-600 border-blue-300 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteConsultation(consultation)}
                      className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700"
                      title="Delete Consultation"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {totalItems > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      )}
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
          {selectedCount} consultation{selectedCount > 1 ? 's' : ''} selected
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

export default ConsultationTable;
