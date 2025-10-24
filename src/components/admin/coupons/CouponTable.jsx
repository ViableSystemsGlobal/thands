
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit3 } from 'lucide-react';
import { format } from 'date-fns';

const CouponTable = ({ coupons, onEdit, onDelete }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusVariant = (isActive, validUntil) => {
    if (!isActive) return 'destructive';
    if (validUntil) {
        try {
            if (new Date(validUntil) < new Date()) return 'secondary';
        } catch (error) {
            return 'secondary'; 
        }
    }
    return 'success';
  };
  
  const getStatusText = (isActive, validUntil) => {
    if (!isActive) return 'Inactive';
    if (validUntil) {
        try {
            if (new Date(validUntil) < new Date()) return 'Expired';
        } catch (error) {
            return 'Invalid Date';
        }
    }
    return 'Active';
  };

  const formatDiscountValue = (coupon) => {
    const value = parseFloat(coupon.discount_value);
    if (isNaN(value)) return 'N/A';

    if (coupon.discount_type === 'percentage') {
      return `${value}%`;
    }
    return `$${value.toFixed(2)}`;
  };

  const formatMinPurchase = (coupon) => {
    if (coupon.min_purchase_amount === null || coupon.min_purchase_amount === undefined) return 'N/A';
    const value = parseFloat(coupon.min_purchase_amount);
    if (isNaN(value)) return 'N/A';
    return `$${value.toFixed(2)}`;
  };
  
  const formatMaxDiscount = (coupon) => {
    if (coupon.discount_type === 'percentage' && coupon.max_discount_amount) {
        const value = parseFloat(coupon.max_discount_amount);
        if (isNaN(value)) return '';
        return `(Max $${value.toFixed(2)})`;
    }
    return '';
  };


  return (
    <div className="bg-white dark:bg-slate-800 shadow-lg rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50 dark:bg-slate-700">
            <TableRow>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Code</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Type</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Value</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Min Purchase</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Valid From</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Valid Until</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Usage</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold">Status</TableHead>
              <TableHead className="text-slate-600 dark:text-slate-300 font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-200 dark:divide-slate-700">
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan="9" className="text-center py-10 text-slate-500 dark:text-slate-400">
                  No coupons found.
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                  <TableCell className="font-medium text-slate-700 dark:text-slate-200">{coupon.code}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300 capitalize">{coupon.discount_type}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {formatDiscountValue(coupon)}
                    {coupon.discount_type === 'percentage' && coupon.max_discount_amount && (
                        <span className="text-xs block text-slate-400 dark:text-slate-500">{formatMaxDiscount(coupon)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {formatMinPurchase(coupon)}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(coupon.valid_from)}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">{formatDate(coupon.valid_until)}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-300">
                    {coupon.usage_count || 0} / {coupon.usage_limit_per_coupon || '∞'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(coupon.is_active, coupon.valid_until)}>
                      {getStatusText(coupon.is_active, coupon.valid_until)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(coupon)} className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(coupon.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CouponTable;
