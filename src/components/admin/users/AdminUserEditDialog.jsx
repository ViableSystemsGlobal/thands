import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import adminUsersApi from '@/lib/services/adminUsersApi';

const AdminUserEditDialog = ({ user, isOpen, onClose, onUserUpdated }) => {
  const [formData, setFormData] = useState({
    full_name: '',
    role: 'manager',
    is_active: true
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState({});

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || '',
        role: user.role || 'manager',
        is_active: user.is_active !== false
      });
      loadRoles();
    }
  }, [user, isOpen]);

  const loadRoles = async () => {
    try {
      const response = await adminUsersApi.getRoles();
      setRoles(response.roles || {});
    } catch (error) {
      console.error('Error loading roles:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.full_name || formData.full_name.length < 2) {
      newErrors.full_name = 'Full name must be at least 2 characters';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await adminUsersApi.updateUser(user.id, formData);
      
      if (onUserUpdated) {
        onUserUpdated(response.user);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Error updating admin user:', error);
      setErrors({ submit: error.response?.data?.error || 'Failed to update admin user' });
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-blue-100 text-blue-800',
      manager: 'bg-green-100 text-green-800',
      support: 'bg-purple-100 text-purple-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  const getRolePermissions = (role) => {
    return roles[role]?.permissions || [];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Admin User</DialogTitle>
          <DialogDescription>
            Update the details for {user?.full_name || user?.email}
          </DialogDescription>
        </DialogHeader>

        {errors.submit && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errors.submit}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              placeholder="John Doe"
              className={errors.full_name ? 'border-red-500' : ''}
            />
            {errors.full_name && (
              <p className="text-red-500 text-sm mt-1">{errors.full_name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roles).map(([key, role]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center space-x-2">
                      <span>{role.name}</span>
                      <Badge className={getRoleColor(key)} variant="secondary">
                        {key}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active User</Label>
          </div>

          {/* Role Permissions Preview */}
          {formData.role && roles[formData.role] && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2 text-sm">
                {roles[formData.role].name} Permissions:
              </h4>
              <div className="flex flex-wrap gap-1">
                {getRolePermissions(formData.role).map((permission) => (
                  <Badge key={permission} variant="outline" className="text-xs">
                    {permission}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminUserEditDialog;
