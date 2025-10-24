
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchAllCoupons, deleteCouponDb } from '@/lib/db';
import CouponTable from '@/components/admin/coupons/CouponTable';
import CouponDialog from '@/components/admin/coupons/CouponDialog';
import PaginationControls from '@/components/admin/PaginationControls';
import { PlusCircle, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";


const CouponsPage = () => {
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogCouponOpen, setIsDialogCouponOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [couponToDeleteId, setCouponToDeleteId] = useState(null);

  const { toast } = useToast();

  const loadCoupons = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchAllCoupons();
      setCoupons(data || []);
    } catch (error) {
      toast({
        title: 'Error fetching coupons',
        description: error.message,
        variant: 'destructive',
      });
      setCoupons([]); 
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleAddCoupon = () => {
    setSelectedCoupon(null);
    setIsDialogCouponOpen(true);
  };

  const handleEditCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setIsDialogCouponOpen(true);
  };

  const handleDeleteCoupon = async () => {
    if (!couponToDeleteId) return;
    setIsLoading(true); 
    try {
      await deleteCouponDb(couponToDeleteId);
      toast({ title: 'Success', description: 'Coupon deleted successfully.' });
      await loadCoupons(); 
    } catch (error) {
      toast({
        title: 'Error deleting coupon',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
        setIsDeleteDialogOpen(false);
        setCouponToDeleteId(null);
        setIsLoading(false);
    }
  };

  const confirmDelete = (id) => {
    setCouponToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };


  const filteredCoupons = coupons.filter(coupon =>
    coupon.code && coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCoupons.length / itemsPerPage);
  const paginatedCoupons = filteredCoupons.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 min-h-screen rounded-xl shadow-2xl">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b border-slate-300 dark:border-slate-700">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-4 sm:mb-0">Manage Coupons</h1>
        <div className="flex space-x-2">
            <Button onClick={loadCoupons} variant="outline" className="text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700" disabled={isLoading}>
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading && coupons.length === 0 ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button onClick={handleAddCoupon} className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={isLoading}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Coupon
            </Button>
        </div>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-slate-500" />
          <Input
            type="text"
            placeholder="Search by coupon code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1); 
            }}
            className="pl-10 w-full bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:ring-indigo-500 focus:border-indigo-500 rounded-lg shadow-sm"
            disabled={isLoading && coupons.length === 0}
          />
        </div>
      </div>

      {isLoading && coupons.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          <CouponTable
            coupons={paginatedCoupons}
            onEdit={handleEditCoupon}
            onDelete={confirmDelete}
          />
          {paginatedCoupons.length > 0 && (
            <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                itemsPerPage={itemsPerPage}
                totalItems={filteredCoupons.length}
                onItemsPerPageChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
                }}
            />
          )}
        </>
      )}

      <CouponDialog
        open={isDialogCouponOpen}
        onOpenChange={setIsDialogCouponOpen}
        coupon={selectedCoupon}
        onSave={() => {
          loadCoupons();
          setIsDialogCouponOpen(false); 
        }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-white dark:bg-slate-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-800 dark:text-slate-100">Are you sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600 dark:text-slate-400">
              This action cannot be undone. This will permanently delete the coupon.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)} className="border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCoupon} className="bg-red-600 hover:bg-red-700 text-white">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
};

export default CouponsPage;
