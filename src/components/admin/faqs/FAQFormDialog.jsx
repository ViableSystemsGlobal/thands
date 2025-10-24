
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { PlusCircle, Edit2 } from 'lucide-react';
import { getProducts } from '@/lib/services/adminApi';

const FAQFormDialog = ({ faq, onSave, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [productId, setProductId] = useState(''); 
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (faq) {
      setQuestion(faq.question || '');
      setAnswer(faq.answer || '');
      setProductId(faq.product_id || ''); 
    } else {
      setQuestion('');
      setAnswer('');
      setProductId('');
    }
  }, [faq, isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await getProducts({ page: 1, limit: 1000 });
      const productsData = response.products || [];
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({ title: 'Error fetching products', variant: 'destructive' });
      setProducts([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question || !answer) {
      toast({ title: 'Question and Answer are required', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      await onSave({ 
        id: faq?.id, 
        question, 
        answer, 
        product_id: productId ? parseInt(productId) : null 
      });
      setIsOpen(false);
    } catch (error) {
      // Error toast is handled by the parent onSave function
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button>
            {faq ? <Edit2 className="mr-2 h-4 w-4" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {faq ? 'Edit FAQ' : 'Add New FAQ'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{faq ? 'Edit FAQ' : 'Add New FAQ'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div>
            <Label htmlFor="product">Product (Optional)</Label>
            <select
              id="product"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full p-2 border rounded-md mt-1"
            >
              <option value="">General FAQ (applies to all products)</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
             <p className="text-xs text-gray-500 mt-1">Leave blank for the FAQ to appear on all product pages.</p>
          </div>
          <div>
            <Label htmlFor="question">Question</Label>
            <Input
              id="question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Enter the question"
              required
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="answer">Answer</Label>
            <Textarea
              id="answer"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Enter the answer"
              rows={4}
              required
              className="mt-1"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save FAQ'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default FAQFormDialog;
