// Simple API test without our API client
import React, { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';

const SimpleApiTest = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const testDirectFetch = async () => {
    setLoading(true);
    setResult(null);

    try {
      console.log('🧪 Testing direct fetch to API...');
      
      // Test health endpoint
      const healthResponse = await fetch('http://localhost:3003/api/health', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      const healthData = await healthResponse.json();
      console.log('✅ Health check successful:', healthData);

      // Test products endpoint
      const productsResponse = await fetch('http://localhost:3003/api/products', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        mode: 'cors'
      });

      if (!productsResponse.ok) {
        throw new Error(`Products fetch failed: ${productsResponse.status}`);
      }

      const productsData = await productsResponse.json();
      console.log('✅ Products fetch successful:', productsData);

      setResult({
        health: healthData,
        products: productsData,
        success: true
      });

      toast({
        title: "✅ API Test Successful!",
        description: `Health: ${healthData.status}, Products: ${productsData.products?.length || 0} items`,
        variant: "default"
      });

    } catch (error) {
      console.error('❌ API test failed:', error);
      setResult({
        error: error.message,
        success: false
      });
      toast({
        title: "❌ API Test Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">🧪 Simple API Test (Direct Fetch)</h2>
        
        <div className="mb-4">
          <button 
            onClick={testDirectFetch}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Testing...' : 'Test Direct API Connection'}
          </button>
        </div>

        {result && (
          <div className={`p-4 rounded-lg ${result.success ? 'bg-green-100 border border-green-400 text-green-700' : 'bg-red-100 border border-red-400 text-red-700'}`}>
            {result.success ? (
              <div>
                <h3 className="font-semibold mb-2">✅ Success!</h3>
                <div className="text-sm space-y-2">
                  <p><strong>Health Check:</strong> {result.health.status}</p>
                  <p><strong>Products Count:</strong> {result.products.products?.length || 0}</p>
                  <p><strong>Total Products:</strong> {result.products.pagination?.total || 0}</p>
                </div>
                {result.products.products?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Sample Product:</h4>
                    <div className="bg-white p-3 rounded border">
                      <p><strong>Name:</strong> {result.products.products[0].name}</p>
                      <p><strong>Category:</strong> {result.products.products[0].category}</p>
                      <p><strong>Price:</strong> ${result.products.products[0].price}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <h3 className="font-semibold">❌ Error:</h3>
                <p>{result.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold text-blue-800">What this test does:</h4>
          <ul className="text-blue-700 text-sm mt-2 space-y-1">
            <li>• Uses direct fetch() instead of our API client</li>
            <li>• Tests CORS configuration</li>
            <li>• Tests both health and products endpoints</li>
            <li>• Shows raw API response data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SimpleApiTest;
