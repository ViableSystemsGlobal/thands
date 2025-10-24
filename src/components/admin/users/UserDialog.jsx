
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUserManagement } from "@/context/admin/UserManagementContext";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

const UserDialog = ({ isOpen, setIsOpen, user, onSuccess }) => {
  const { inviteUser } = useUserManagement();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  // const [role, setRole] = useState("admin"); // For future role selection
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditMode = !!user; // In a full system, this would populate more fields.

  useEffect(() => {
    if (isEditMode && user) {
      setEmail(user.email || "");
      // setRole(user.role || "admin"); 
    } else {
      setEmail("");
      // setRole("admin");
    }
  }, [user, isEditMode, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (!email) {
      toast({ title: "Error", description: "Email is required.", variant: "destructive" });
      setIsSubmitting(false);
      return;
    }

    let result;
    if (isEditMode) {
      // Placeholder for actual user update logic (requires backend)
      toast({ title: "Edit User (Simulated)", description: `User ${email} details would be updated. This is a placeholder.`, variant: "info" });
      result = { success: true }; // Simulate success
    } else {
      result = await inviteUser(email); // 'admin' role is conceptual here
    }

    if (result.success) {
      // Toast is handled by inviteUser for now or would be here for edit
      if (!isEditMode) { // Invite user specific toast handled in context for demo
        // toast({ title: "Success", description: result.message || "User invited successfully."});
      } else {
         toast({ title: "Success", description: "User details updated (simulated)."});
      }
      setIsOpen(false);
      if (onSuccess) onSuccess();
    } else {
      // Toast is handled by inviteUser for invite failure
      if(isEditMode) {
        toast({ title: "Error", description: result.error || "Failed to update user.", variant: "destructive" });
      }
    }
    setIsSubmitting(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] bg-white shadow-2xl rounded-lg">
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-2xl font-light text-gray-800">
            {isEditMode ? "Edit User (Simulated)" : "Invite New Admin User"}
          </DialogTitle>
          <DialogDescription className="text-gray-500 pt-1">
            {isEditMode ? "Modify the details for this user." : "Enter the email of the user you want to invite as an admin."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
              <Label htmlFor="email" className="text-gray-700 font-medium mb-1 block">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full border-gray-300 focus:border-gray-500 focus:ring-gray-500"
                disabled={isEditMode} // Email typically not editable after creation for auth users
              />
            </div>
            {/* Placeholder for role selection if roles were managed
            <div>
              <Label htmlFor="role" className="text-gray-700 font-medium mb-1 block">Role</Label>
              <Select value={role} onValueChange={setRole} disabled={isEditMode}>
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor (Example)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            */}
          </div>
          <DialogFooter className="p-6 border-t bg-gray-50 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="hover:bg-gray-100"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-gradient-to-r from-gray-700 to-black text-white hover:from-gray-600 hover:to-gray-800" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isEditMode ? "Saving..." : "Sending Invite..."}
                </>
              ) : (
                isEditMode ? "Save Changes (Simulated)" : "Send Invitation"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserDialog;
