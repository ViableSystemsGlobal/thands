
import React from 'react';
import { Loader2 } from 'lucide-react';

const PageLoadingSpinnerCheckout = () => (
 <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 flex items-center justify-center">
    <div className="text-center">
      <Loader2 className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-gray-700 mx-auto" />
      <p className="mt-4 text-lg text-gray-700">Loading checkout...</p>
    </div>
  </div>
);

export default PageLoadingSpinnerCheckout;
