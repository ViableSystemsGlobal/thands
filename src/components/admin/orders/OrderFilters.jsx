
import React from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const OrderFilters = ({ 
  currentTab, 
  onTabChange, 
  searchQuery, 
  onSearchChange, 
  dateRange, 
  onDateRangeChange 
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
        <h1 className="text-3xl font-light text-gray-900">Orders Management</h1>
        <Select value={dateRange} onValueChange={onDateRangeChange}>
          <SelectTrigger className="w-full md:w-[200px] bg-white border-gray-300">
            <SelectValue placeholder="Select date range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="7days">Past 7 Days</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="ytd">Year to Date</SelectItem>
            <SelectItem value="all_time">All Time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Tabs value={currentTab} onValueChange={onTabChange} className="w-full md:w-auto">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="pending_payment">Pending Payment</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search by Order #, Customer Name/Email"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderFilters;
