import React from "react";
import { Globe } from "lucide-react";
import { useAdminBranch } from "@/context/AdminBranchContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const branchFlags = {
  GH: "🇬🇭",
  UK: "🇬🇧",
  US: "🇺🇸",
  ALL: "🌍",
};

const branchNames = {
  GH: "Ghana",
  UK: "United Kingdom",
  US: "United States",
  ALL: "All Regions",
};

const AdminBranchSelector = ({ className = "" }) => {
  const { selectedBranch, accessibleBranches, isSuperAdmin, loading, updateSelectedBranch, getBranchOptions } = useAdminBranch();
  const [isChanging, setIsChanging] = React.useState(false);

  const branchOptions = getBranchOptions();
  
  // Debug logging
  console.log('🔍 AdminBranchSelector Debug:', {
    selectedBranch,
    accessibleBranches,
    isSuperAdmin,
    loading,
    branchOptions,
    branchOptionsLength: branchOptions.length
  });

  const handleBranchChange = async (value) => {
    if (value !== selectedBranch) {
      setIsChanging(true);
      try {
        updateSelectedBranch(value);
        // Reload page to apply branch filter throughout admin
        window.location.reload();
      } catch (error) {
        console.error('Error changing branch:', error);
      } finally {
        setIsChanging(false);
      }
    }
  };

  const getBranchDisplay = (code) => {
    const flag = branchFlags[code] || "🌍";
    const name = branchNames[code] || code;
    return `${flag} ${name}`;
  };

  if (loading) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-2 bg-slate-700 rounded-lg px-3 py-2">
          <Globe className="w-4 h-4 text-slate-400 animate-pulse" />
          <span className="text-xs text-slate-400 uppercase tracking-wider">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-2">
        <Globe className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span className="text-xs text-slate-400 uppercase tracking-wider">
          {isSuperAdmin ? 'Region:' : 'Branch:'}
        </span>
      </div>
        <Select 
        value={selectedBranch || 'ALL'} 
          onValueChange={handleBranchChange} 
          disabled={isChanging || loading}
        >
        <SelectTrigger className="w-full h-9 text-sm bg-slate-700 border-slate-600 text-white hover:bg-slate-600 focus:ring-2 focus:ring-slate-500 focus:ring-offset-0">
            <SelectValue>
            {isChanging ? 'Switching...' : getBranchDisplay(selectedBranch || 'ALL')}
            </SelectValue>
          </SelectTrigger>
        <SelectContent className="!bg-slate-700 !border-slate-600 !text-white z-[100] shadow-xl [&>*]:text-white">
          {branchOptions.length === 0 && (
            <div className="p-2 text-sm text-slate-400">Loading branches...</div>
          )}
          {branchOptions.map((branch) => (
              <SelectItem 
                key={branch.branch_code} 
                value={branch.branch_code}
              className="!text-white hover:!bg-slate-600 hover:!text-white focus:!bg-slate-600 focus:!text-white data-[highlighted]:!bg-slate-600 data-[highlighted]:!text-white cursor-pointer"
              >
                {getBranchDisplay(branch.branch_code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
    </div>
  );
};

export default AdminBranchSelector;
