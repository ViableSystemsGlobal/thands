import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import adminApiClient from "@/lib/services/adminApiClient";

const AdminBranchContext = createContext(null);

export const useAdminBranch = () => {
  const context = useContext(AdminBranchContext);
  if (!context) {
    throw new Error("useAdminBranch must be used within an AdminBranchProvider");
  }
  return context;
};

export const AdminBranchProvider = ({ children }) => {
  const { user } = useAdminAuth();
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Get selected branch from localStorage, default to 'ALL' for super admin, first accessible branch for regular admin
  const [selectedBranch, setSelectedBranch] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('admin_selected_branch');
      if (stored) return stored;
    }
    return isSuperAdmin ? 'ALL' : null; // Will be set when accessible branches load
  });
  
  const [accessibleBranches, setAccessibleBranches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch accessible branches for the admin
  const fetchAccessibleBranches = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get('/branches/admin/accessible');
      console.log('📊 AdminBranchContext: Full response:', response);
      
      // adminApiClient returns { success: true, data: {...} }
      // The actual response from server is in response.data
      const serverResponse = response.data || {};
      const branches = serverResponse.branches || [];
      
      console.log('📊 AdminBranchContext: Branches from API:', branches);
      
      // If super admin and no branches returned, use default branches
      if (isSuperAdmin && branches.length === 0) {
        console.log('⚠️ AdminBranchContext: No branches returned, using defaults for super admin');
        const defaultBranches = [
          { branch_code: 'GH', branch_name: 'Ghana' },
          { branch_code: 'UK', branch_name: 'United Kingdom' },
          { branch_code: 'US', branch_name: 'United States' }
        ];
        setAccessibleBranches(defaultBranches);
      } else if (branches.length > 0) {
        setAccessibleBranches(branches);
        
        // If no branch is selected and user is not super admin, select first accessible branch
        if (!selectedBranch && !isSuperAdmin && branches.length > 0) {
          const firstBranch = branches[0].branch_code;
          setSelectedBranch(firstBranch);
          if (typeof window !== 'undefined') {
            localStorage.setItem('admin_selected_branch', firstBranch);
          }
        }
      } else {
        console.warn('⚠️ AdminBranchContext: No accessible branches found for user');
        setAccessibleBranches([]);
      }
    } catch (error) {
      console.error('❌ AdminBranchContext: Error fetching accessible branches:', error);
      // On error, if super admin, use default branches
      if (isSuperAdmin) {
        const defaultBranches = [
          { branch_code: 'GH', branch_name: 'Ghana' },
          { branch_code: 'UK', branch_name: 'United Kingdom' },
          { branch_code: 'US', branch_name: 'United States' }
        ];
        setAccessibleBranches(defaultBranches);
      }
    } finally {
      setLoading(false);
    }
  }, [isSuperAdmin, selectedBranch]);

  // Initialize on mount
  useEffect(() => {
    if (user) {
      fetchAccessibleBranches();
    }
  }, [user, fetchAccessibleBranches]);

  // Update selected branch
  const updateSelectedBranch = useCallback((branchCode) => {
    setSelectedBranch(branchCode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_selected_branch', branchCode);
    }
  }, []);

  // Get branch filter for API calls (null for "ALL", branch_code otherwise)
  const getBranchFilter = useCallback(() => {
    if (selectedBranch === 'ALL') {
      return null; // Super admin viewing all branches
    }
    return selectedBranch;
  }, [selectedBranch]);

  // Get available branch options (includes "All" for super admin)
  const getBranchOptions = useCallback(() => {
    const options = [];
    
    if (isSuperAdmin) {
      options.push({ branch_code: 'ALL', branch_name: 'All Regions' });
    }
    
    options.push(...accessibleBranches);
    
    return options;
  }, [isSuperAdmin, accessibleBranches]);

  const value = {
    selectedBranch,
    accessibleBranches,
    isSuperAdmin,
    loading,
    updateSelectedBranch,
    getBranchFilter,
    getBranchOptions,
    refreshBranches: fetchAccessibleBranches,
  };

  return (
    <AdminBranchContext.Provider value={value}>
      {children}
    </AdminBranchContext.Provider>
  );
};

