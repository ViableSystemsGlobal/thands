// Test component to verify API integration
import React, { useState, useEffect } from 'react';
import { productsApi } from '@/lib/services/productsApi';
import { useToast } from '@/components/ui/use-toast';

const ApiTest = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    testApiConnection();
  }, []);

  const testApiConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🧪 Testing API connection...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3003/api/health');
      const healthData = await healthResponse.json();
      console.log('✅ Health check:', healthData);

      // Test products endpoint
      const response = await productsApi.fetchProducts();
      console.log('✅ Products API response:', response);
      
      setProducts(response.products || []);
      
      toast({
        title: "API Test Successful!",
        description: `Found ${response.products?.length || 0} products`,
        variant: "default"
      });

    } catch (err) {
      console.error('❌ API test failed:', err);
      setError(err.message);
      toast({
        title: "API Test Failed",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🧪 API Integration Test</h2>
        
        <div className="mb-4">
          <button 
            onClick={testApiConnection}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test API Connection'}
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error:</strong> {error}
          </div>
        )}

        {loading && (
          <div className="text-gray-600">Loading products from new API...</div>
        )}

        {products.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">
              ✅ Products from New API ({products.length} found):
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div key={product.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold">{product.name}</h4>
                  <p className="text-gray-600 text-sm">{product.category}</p>
                  <p className="text-green-600 font-bold">${product.price}</p>
                  <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                  <p className="text-xs text-gray-500">Stock: {product.stock_quantity}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">What this test does:</h4>
          <ul className="text-blue-700 text-sm mt-2 space-y-1">
            <li>• Tests connection to http://localhost:3003/api/health</li>
            <li>• Fetches products from http://localhost:3003/api/products</li>
            <li>• Compares with your current Supabase setup</li>
            <li>• Verifies data format compatibility</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;
