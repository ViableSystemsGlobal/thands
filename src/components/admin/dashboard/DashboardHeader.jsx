
import React from 'react';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { CalendarDays } from 'lucide-react';

const DashboardHeader = ({ dateRange, onDateRangeChange }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
      <h1 className="text-3xl md:text-4xl font-light text-gray-800">Dashboard Overview</h1>
      <div className="w-full sm:w-auto">
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-full sm:w-[200px] bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Select date range" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Past 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default DashboardHeader;
