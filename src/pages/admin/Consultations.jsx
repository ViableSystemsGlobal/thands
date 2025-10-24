import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { exportToCSV } from "@/lib/export";
import { getConsultations, updateConsultationStatus, deleteConsultation, bulkDeleteConsultations, getConsultationMetrics } from "@/lib/services/adminApi";
import ConsultationTable from "@/components/admin/consultations/ConsultationTable";
import ConsultationDetailsDialog from "@/components/admin/consultations/ConsultationDetailsDialog";
import ConsultationFilters from "@/components/admin/consultations/ConsultationFilters";
import ConsultationMetrics from "@/components/admin/consultations/ConsultationMetrics";
import { Loader2 } from "lucide-react";
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

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

const ConsultationsContent = () => {
  const { toast } = useToast();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE_OPTIONS[0]);
  const [totalConsultationsCount, setTotalConsultationsCount] = useState(0);

  // Selection state
  const [selectedConsultations, setSelectedConsultations] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isIndeterminate, setIsIndeterminate] = useState(false);

  // Delete dialog state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [consultationToDelete, setConsultationToDelete] = useState(null);

  const [metrics, setMetrics] = useState({
    totalConsultations: 0,
    pendingConsultations: 0,
    confirmedConsultations: 0,
  });

  // Fetch consultations using new API
  const fetchConsultations = useCallback(async () => {
    setLoading(true);
    try {
      console.log('🔍 Admin Consultations: Starting to fetch consultations...');

      // Fetch consultations and metrics in parallel
      const [consultationsResponse, metricsData] = await Promise.all([
        getConsultations({
          page: currentPage,
          limit: itemsPerPage,
          search: searchQuery,
          status: statusFilter !== 'all' ? statusFilter : undefined,
          type: typeFilter !== 'all' ? typeFilter : undefined,
          sort_by: 'created_at',
          sort_order: 'desc'
        }),
        getConsultationMetrics()
      ]);

      console.log('✅ Admin Consultations: Consultations fetched:', consultationsResponse.consultations?.length || 0);
      console.log('📊 Admin Consultations: Pagination:', consultationsResponse.pagination);
      console.log('✅ Admin Consultations: Metrics fetched:', metricsData);

      setConsultations(consultationsResponse.consultations || []);
      setTotalConsultationsCount(consultationsResponse.pagination?.total || 0);

      // Set metrics from the separate API call (for ALL consultations)
      setMetrics({
        totalConsultations: metricsData.totalConsultations,
        pendingConsultations: metricsData.pendingConsultations,
        confirmedConsultations: metricsData.confirmedConsultations,
      });

      console.log('📊 Frontend: Metrics set:', {
        totalConsultations: metricsData.totalConsultations,
        pendingConsultations: metricsData.pendingConsultations,
        confirmedConsultations: metricsData.confirmedConsultations
      });

    } catch (error) {
      console.error("❌ Admin Consultations: Error fetching consultations:", error);

      toast({
        title: "Error",
        description: error.message || "Failed to fetch consultations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🏁 Admin Consultations: Fetch completed');
    }
  }, [toast, currentPage, itemsPerPage, searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    fetchConsultations();
  }, [fetchConsultations]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, typeFilter]);

  // Update selection state when consultations change
  useEffect(() => {
    if (consultations.length === 0) {
      setSelectedConsultations([]);
      setIsAllSelected(false);
      setIsIndeterminate(false);
      return;
    }

    const validSelectedConsultations = selectedConsultations.filter(id => 
      consultations.some(consultation => consultation.id === id)
    );
    
    if (validSelectedConsultations.length !== selectedConsultations.length) {
      setSelectedConsultations(validSelectedConsultations);
    }

    const allSelected = validSelectedConsultations.length === consultations.length && consultations.length > 0;
    const someSelected = validSelectedConsultations.length > 0 && validSelectedConsultations.length < consultations.length;
    
    setIsAllSelected(allSelected);
    setIsIndeterminate(someSelected);
  }, [consultations, selectedConsultations]);

  const handleUpdateConsultationStatus = async (id, status) => {
    try {
      console.log('🔍 Admin Consultations: Updating consultation status:', { id, status });

      await updateConsultationStatus(id, status);

      // Update local state immediately for better UX
      setConsultations(prevConsultations => 
        prevConsultations.map(consultation =>
          consultation.id === id ? { ...consultation, status } : consultation
        )
      );

      // Re-fetch to update metrics and ensure consistency
      fetchConsultations();

      toast({
        title: "Success",
        description: "Consultation status updated successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("❌ Admin Consultations: Error updating consultation status:", error);
      toast({
        title: "Error Updating Status",
        description: error.message || "Failed to update consultation status.",
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = (consultation) => {
    setSelectedConsultation(consultation);
    setIsDialogOpen(true);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Selection handlers
  const handleSelectConsultation = (id, checked) => {
    if (checked) {
      setSelectedConsultations([...selectedConsultations, id]);
    } else {
      setSelectedConsultations(selectedConsultations.filter((i) => i !== id));
    }
  };

  const handleSelectAll = () => {
    if (selectedConsultations.length === consultations.length) {
      setSelectedConsultations([]);
      setIsAllSelected(false);
      setIsIndeterminate(false);
    } else {
      setSelectedConsultations(consultations.map((consultation) => consultation.id));
      setIsAllSelected(true);
      setIsIndeterminate(false);
    }
  };

  const handleClearSelection = () => {
    setSelectedConsultations([]);
    setIsAllSelected(false);
    setIsIndeterminate(false);
  };

  // Delete handlers
  const handleDeleteConsultation = (consultation) => {
    setConsultationToDelete(consultation);
    setShowDeleteDialog(true);
  };

  const confirmDeleteConsultation = async () => {
    if (!consultationToDelete) return;

    try {
      console.log('🔍 Admin Consultations: Deleting consultation:', consultationToDelete.id);

      await deleteConsultation(consultationToDelete.id);

      toast({
        title: "Success",
        description: "Consultation has been deleted",
      });

      // Refresh the data
      fetchConsultations();
    } catch (error) {
      console.error("❌ Admin Consultations: Error deleting consultation:", error);
      toast({
        title: "Error",
        description: "Failed to delete consultation",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setConsultationToDelete(null);
    }
  };

  // Bulk actions
  const handleBulkExport = async () => {
    const selectedConsultationData = consultations.filter(c => selectedConsultations.includes(c.id));
    const dataToExport = selectedConsultationData.map(c => ({
      ID: c.id,
      Name: c.name,
      Email: c.email,
      Phone: c.phone,
      Type: c.type,
      Status: c.status,
      DateSubmitted: new Date(c.created_at).toLocaleDateString(),
    }));
    exportToCSV(dataToExport, "selected_consultations");
    toast({
      title: "Success",
      description: `Exported ${selectedConsultations.length} consultations`,
    });
  };

  const handleBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmBulkDelete = async () => {
    try {
      console.log('🔍 Admin Consultations: Bulk deleting consultations:', selectedConsultations);

      await bulkDeleteConsultations(selectedConsultations);

      toast({
        title: "Success",
        description: `Deleted ${selectedConsultations.length} consultations`,
      });

      fetchConsultations();
      handleClearSelection();
    } catch (error) {
      console.error("❌ Admin Consultations: Error deleting consultations:", error);
      toast({
        title: "Error",
        description: "Failed to delete consultations",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const totalPages = Math.ceil(totalConsultationsCount / itemsPerPage);

  if (loading && consultations.length === 0 && currentPage === 1) {
    return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen flex justify-center items-center">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-screen">
        <ConsultationFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
        />
        <ConsultationMetrics metrics={metrics} loading={loading && consultations.length > 0 && currentPage === 1} />
        
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 mt-8">
          <ConsultationTable
            consultations={consultations}
            onUpdateStatus={handleUpdateConsultationStatus}
            onViewDetails={handleViewDetails}
            onDeleteConsultation={handleDeleteConsultation}
            loading={loading}
            initialLoading={loading && consultations.length === 0 && currentPage === 1}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={itemsPerPage}
            totalItems={totalConsultationsCount}
            onItemsPerPageChange={handleItemsPerPageChange}
            selectedConsultations={selectedConsultations}
            onSelectConsultation={handleSelectConsultation}
            onSelectAll={handleSelectAll}
            isAllSelected={isAllSelected}
            isIndeterminate={isIndeterminate}
            onBulkDelete={handleBulkDelete}
            onBulkExport={handleBulkExport}
            onClearSelection={handleClearSelection}
          />
        </div>
      
        <ConsultationDetailsDialog
          consultation={selectedConsultation}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
        />

        {showDeleteDialog && (consultationToDelete || selectedConsultations.length > 0) && (
          <AlertDialog open={showDeleteDialog} onOpenChange={() => setShowDeleteDialog(false)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {consultationToDelete 
                    ? 'Delete Consultation?'
                    : `Delete ${selectedConsultations.length} Selected Consultation${selectedConsultations.length > 1 ? 's' : ''}?`
                  }
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {consultationToDelete 
                    ? 'This will permanently delete this consultation record and cannot be undone.'
                    : `This will permanently delete ${selectedConsultations.length} consultation record${selectedConsultations.length > 1 ? 's' : ''} and cannot be undone.`
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => {
                  setShowDeleteDialog(false);
                  setConsultationToDelete(null);
                }}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={consultationToDelete ? confirmDeleteConsultation : confirmBulkDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
  );
};

const Consultations = () => {
  return <ConsultationsContent />;
};
export default Consultations;
