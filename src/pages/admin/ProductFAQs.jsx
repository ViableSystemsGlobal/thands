
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { fetchAllFAQsForAdmin, addFAQ, deleteFAQ } from '@/lib/db/faqs';
import FAQFormDialog from '@/components/admin/faqs/FAQFormDialog';
import { Trash2, PlusCircle } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';

const ProductFAQs = () => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const loadFAQs = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllFAQsForAdmin();
      setFaqs(data);
    } catch (error) {
      toast({
        title: 'Error fetching FAQs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFAQs();
  }, [loadFAQs]);

  const handleAddFAQ = async (faqData) => {
    try {
      await addFAQ(faqData);
      toast({ title: 'FAQ added successfully', variant: 'success' });
      loadFAQs();
    } catch (error) {
      toast({
        title: 'Error adding FAQ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    try {
      await deleteFAQ(faqId);
      toast({ title: 'FAQ deleted successfully', variant: 'success' });
      loadFAQs(); 
    } catch (error) {
      toast({
        title: 'Error deleting FAQ',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
      <motion.div 
        className="p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-light">Manage FAQs</h1>
          <FAQFormDialog onSave={handleAddFAQ}>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New FAQ
            </Button>
          </FAQFormDialog>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : faqs.length === 0 ? (
          <p className="text-center text-gray-500">No FAQs found. Add one to get started!</p>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30%]">Question</TableHead>
                  <TableHead className="w-[40%]">Answer</TableHead>
                  <TableHead>Product Specificity</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqs.map((faq) => (
                  <TableRow key={faq.id}>
                    <TableCell className="font-medium">{faq.question}</TableCell>
                    <TableCell className="text-sm text-gray-600 truncate max-w-xs">{faq.answer}</TableCell>
                    <TableCell>
                      {faq.products?.name ? (
                        <span className="font-semibold">{faq.products.name}</span>
                      ) : (
                        <span className="italic text-gray-500">General</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                       <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete this FAQ.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteFAQ(faq.id)}
                              className="bg-red-500 hover:bg-red-600"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
  );
};

export default ProductFAQs;
