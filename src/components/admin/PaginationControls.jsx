
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationControls = ({ currentPage, totalPages, onPageChange, itemsPerPage, totalItems, onItemsPerPageChange }) => {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  if (totalPages <= 1 && (!onItemsPerPageChange || !itemsPerPage)) {
    return null; 
  }

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200">
      <div className="text-sm text-gray-600 mb-2 sm:mb-0">
        {totalItems > 0 ? (
          <span>
            Showing <span className="font-semibold">{startItem}</span> - <span className="font-semibold">{endItem}</span> of <span className="font-semibold">{totalItems}</span> results
          </span>
        ) : (
          <span>No results</span>
        )}
      </div>
      <div className="flex items-center space-x-2">
        {onItemsPerPageChange && itemsPerPage && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
              className="p-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              {[10, 20, 50, 100].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}
        {totalPages > 1 && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            <span className="text-sm text-gray-700 px-2">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="hover:bg-gray-100"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4 ml-1 sm:ml-2" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaginationControls;
