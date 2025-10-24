
import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useUserManagement } from "@/context/admin/UserManagementContext";
import UserDialog from "./UserDialog"; 
import { format } from "date-fns";
import { PlusCircle, Edit3, Trash2, MoreVertical, Loader2 } from "lucide-react";
import PaginationControls from "@/components/admin/PaginationControls";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50];

const UserTable = () => {
  const { users, loading, fetchUsers, totalUsers, setPagination, pagination } = useUserManagement();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    setPagination(prev => ({ ...prev, searchTerm }));
  }, [searchTerm, setPagination]);

  const handleAddNewUser = () => {
    setSelectedUser(null);
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user) => {
    alert(`Editing user: ${user.email} (Placeholder - Full edit requires backend)`);
  };

  const handleDeleteUser = async (userId, userEmail) => {
     alert(`Deleting user: ${userEmail} (Placeholder - Full delete requires backend)`);
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handleItemsPerPageChange = (value) => {
    setPagination(prev => ({ ...prev, itemsPerPage: value, currentPage: 1 }));
  };
  
  const totalPages = Math.ceil(totalUsers / pagination.itemsPerPage);

  return (
    <>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-light text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage admin users and their access.</p>
        </div>
        <Button onClick={handleAddNewUser} className="bg-gradient-to-r from-gray-700 to-black text-white hover:from-gray-600 hover:to-gray-800">
          <PlusCircle className="mr-2 h-5 w-5" />
          Invite New User
        </Button>
      </div>

      <div className="mb-4">
        <Input 
          placeholder="Search users by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <motion.div 
        className="bg-white rounded-lg shadow-lg overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-100 transition-colors">
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">User</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Email</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Role</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Last Sign In</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Joined Date</TableHead>
                <TableHead className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">Status</TableHead>
                <TableHead className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-200">
              {loading && (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-700 mx-auto mb-2"></div>
                    <p className="text-gray-500">Loading users...</p>
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
              {!loading && users.map((user) => (
                <TableRow key={user.id} className="hover:bg-gray-50 transition-colors">
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.user_metadata?.first_name || 'N/A'} {user.user_metadata?.last_name || ''}
                    </div>
                    <div className="text-xs text-gray-500">{user.user_metadata?.phone || 'No phone'}</div>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {user.role || 'Admin'} 
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), "PPpp") : "Never"}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.created_at ? format(new Date(user.created_at), "PP") : "N/A"}
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap">
                    <Badge className={user.email_confirmed_at ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {user.email_confirmed_at ? "Verified" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit (Placeholder)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id, user.email)} className="text-red-600 hover:!text-red-700 hover:!bg-red-50">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete (Placeholder)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {totalUsers > 0 && (
           <PaginationControls
            currentPage={pagination.currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={pagination.itemsPerPage}
            totalItems={totalUsers}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        )}
      </motion.div>

      {isUserDialogOpen && (
        <UserDialog
          isOpen={isUserDialogOpen}
          setIsOpen={setIsUserDialogOpen}
          user={selectedUser}
          onSuccess={fetchUsers}
        />
      )}
    </>
  );
};

export default UserTable;
