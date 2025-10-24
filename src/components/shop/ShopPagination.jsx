
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const ShopPagination = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) {
    return null;
  }

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
  
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    const halfPagesToShow = Math.floor(maxPagesToShow / 2);

    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= halfPagesToShow) {
        for (let i = 1; i <= maxPagesToShow -1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - halfPagesToShow) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - maxPagesToShow + 2; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - halfPagesToShow +1 ; i <= currentPage + halfPagesToShow -1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    return pageNumbers;
  };


  return (
    <div className="flex justify-center items-center gap-2 mt-12 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="rounded-full hover:bg-gray-100 hover:border-gray-400"
        aria-label="Previous page"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>
      
      {getPageNumbers().map((page, index) => (
        typeof page === 'number' ? (
          <Button
            key={index}
            variant={currentPage === page ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page)}
            className={`rounded-full w-10 h-10 ${currentPage === page ? 'bg-gray-900 hover:bg-gray-800 text-white' : 'hover:bg-gray-100 hover:border-gray-400'}`}
            aria-label={`Go to page ${page}`}
          >
            {page}
          </Button>
        ) : (
          <span key={index} className="text-gray-500 px-2">...</span>
        )
      ))}

      <Button
        variant="outline"
        size="icon"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="rounded-full hover:bg-gray-100 hover:border-gray-400"
        aria-label="Next page"
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ShopPagination;
