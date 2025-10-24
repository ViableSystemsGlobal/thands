
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search, ListFilter, Type } from 'lucide-react';

const ConsultationFilters = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  typeFilter,
  onTypeFilterChange,
}) => {
  return (
    <div className="mb-8 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow"
          />
        </div>
        
        <div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-full py-2.5 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow">
              <div className="flex items-center">
                <ListFilter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select value={typeFilter} onValueChange={onTypeFilterChange}>
            <SelectTrigger className="w-full py-2.5 border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 transition-shadow">
               <div className="flex items-center">
                <Type className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filter by type" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="design">Design</SelectItem>
              <SelectItem value="booking">Booking</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ConsultationFilters;
