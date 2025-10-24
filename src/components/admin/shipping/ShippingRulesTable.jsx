import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit2, Trash2 } from "lucide-react";
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

const ShippingRulesTable = ({ rules, onEdit, onDelete }) => {
  const formatCurrency = (amount) => {
    
    return amount !== null && amount !== undefined ? Number(amount).toFixed(2) : "N/A";
  };


  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Rule Name</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Countries</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">State/Region</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Order Amount Range</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Shipping Fee</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Delivery Time</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Carrier</TableHead>
            <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</TableHead>
            <TableHead className="px-6 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-slate-200">
          {rules.map((rule) => (
            <motion.tr
              key={rule.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="hover:bg-slate-50 transition-colors"
            >
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{rule.name}</TableCell>
              <TableCell className="px-6 py-4 text-sm text-slate-700 max-w-xs">
                {rule.countries && rule.countries.length > 0 ? rule.countries.join(", ") : "International"}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{rule.state || "All"}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                {formatCurrency(rule.min_amount)} - {rule.max_amount ? formatCurrency(rule.max_amount) : "No limit"}
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-800">{formatCurrency(rule.shipping_fee)}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{rule.delivery_time || "N/A"}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{rule.carrier || "N/A"}</TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap">
                <Badge
                  variant={rule.is_active ? "success" : "destructive"}
                  className={`capitalize text-xs px-2.5 py-1 rounded-full font-medium ${
                    rule.is_active
                      ? "bg-green-100 text-green-700 border border-green-300"
                      : "bg-red-100 text-red-700 border border-red-300"
                  }`}
                >
                  {rule.is_active ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onEdit(rule)}
                  className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-full p-1.5 mr-2 transition-all"
                  aria-label="Edit rule"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-800 hover:bg-red-50 rounded-full p-1.5 transition-all"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the shipping rule "{rule.name}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(rule.id)}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ShippingRulesTable;
