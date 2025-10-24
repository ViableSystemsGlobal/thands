import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, Filter } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../../components/ui/alert-dialog';
import { useToast } from '../../components/ui/use-toast';
import { 
  getKnowledgeBaseEntries, 
  createKnowledgeBaseEntry, 
  updateKnowledgeBaseEntry, 
  deleteKnowledgeBaseEntry, 
  toggleKnowledgeBaseEntryStatus,
  getKnowledgeBaseCategories
} from '../../lib/db/knowledgeBase';
import KnowledgeBaseDialog from '../../components/admin/knowledgebase/KnowledgeBaseDialog';

const KnowledgeBase = () => {
  const [entries, setEntries] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch data
  useEffect(() => {
    fetchEntries();
    fetchCategories();
  }, []);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedCategory !== 'all') filters.category = selectedCategory;
      if (statusFilter !== 'all') filters.isActive = statusFilter === 'active';

      const { data, error } = await getKnowledgeBaseEntries(filters);
      if (error) throw error;
      setEntries(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch knowledge base entries",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await getKnowledgeBaseCategories();
      if (error) throw error;
      // Filter out empty strings to prevent Select.Item errors
      setCategories(data.filter(category => category && category.trim() !== ''));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Apply filters
  useEffect(() => {
    fetchEntries();
  }, [searchTerm, selectedCategory, statusFilter]);

  const handleCreate = () => {
    setSelectedEntry(null);
    setDialogOpen(true);
  };

  const handleEdit = (entry) => {
    setSelectedEntry(entry);
    setDialogOpen(true);
  };

  const handleSave = async (entryData) => {
    try {
      if (selectedEntry) {
        // Update existing entry
        const { error } = await updateKnowledgeBaseEntry(selectedEntry.id, entryData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Knowledge base entry updated successfully"
        });
      } else {
        // Create new entry
        const { error } = await createKnowledgeBaseEntry(entryData);
        if (error) throw error;
        toast({
          title: "Success",
          description: "Knowledge base entry created successfully"
        });
      }
      setDialogOpen(false);
      fetchEntries();
      fetchCategories();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save knowledge base entry",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await deleteKnowledgeBaseEntry(id);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Knowledge base entry deleted successfully"
      });
      fetchEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete knowledge base entry",
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const { error } = await toggleKnowledgeBaseEntryStatus(id, !currentStatus);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Knowledge base entry status updated"
      });
      fetchEntries();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update entry status",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
        <Button onClick={handleCreate} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Entry
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search entries..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.filter(category => category && category.trim() !== '').map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Knowledge Base Table */}
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Entries ({entries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No knowledge base entries found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{entry.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {entry.content}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {entry.category && (
                        <Badge variant="secondary">{entry.category}</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={entry.is_active ? "default" : "secondary"}>
                        {entry.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(entry.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(entry.id, entry.is_active)}
                        >
                          {entry.is_active ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(entry)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this knowledge base entry? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(entry.id)}>
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Knowledge Base Dialog */}
      <KnowledgeBaseDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        entry={selectedEntry}
      />
    </div>
  );
};

export default KnowledgeBase; 