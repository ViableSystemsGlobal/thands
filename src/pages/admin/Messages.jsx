
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import adminApiClient from "@/lib/services/adminApiClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Loader2, Mail } from "lucide-react";

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, [pagination.page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await adminApiClient.get(`/messages?page=${pagination.page}&limit=${pagination.limit}`);
      console.log('Messages response:', response);
      
      const messagesData = response.data?.messages || response.messages || [];
      const paginationData = response.data?.pagination || response.pagination || { total: messagesData.length, page: 1, limit: 10 };
      
      setMessages(messagesData);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const updateMessageStatus = async (messageId, newStatus) => {
    try {
      await adminApiClient.put(`/messages/${messageId}`, { status: newStatus });
      
      // Update local state
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, status: newStatus } : msg
      ));
      
      toast({
        title: "Success",
        description: "Message status updated successfully",
      });
    } catch (error) {
      console.error("Error updating message status:", error);
      toast({
        title: "Error",
        description: "Failed to update message status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      new: "bg-blue-100 text-blue-800 hover:bg-blue-200",
      read: "bg-green-100 text-green-800 hover:bg-green-200",
      replied: "bg-purple-100 text-purple-800 hover:bg-purple-200",
      archived: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    };
    const defaultStyle = "bg-gray-100 text-gray-800 hover:bg-gray-200";
    return (
      <Badge className={`${statusStyles[status] || defaultStyle} capitalize transition-colors`}>
        {status || "new"}
      </Badge>
    );
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-theme(spacing.16))] bg-gradient-to-br from-slate-50 to-gray-100">
          <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
        </div>
    );
  }

  return (
      <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-light text-gray-800">Contact Messages</h1>
          <p className="text-gray-500 mt-1">View and manage messages submitted through your contact form.</p>
        </div>
        
        {messages.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-lg shadow-md">
            <Mail className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No messages</h3>
            <p className="mt-1 text-sm text-gray-500">You currently have no messages.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Name</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Email</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Subject</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider max-w-xs">Message</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</TableHead>
                    <TableHead className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-200">
                  {messages.map((message) => (
                    <TableRow key={message.id} className="hover:bg-slate-50 transition-colors">
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                        {format(new Date(message.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{message.name}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{message.email}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">{message.subject}</TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-700 max-w-xs truncate hover:whitespace-normal hover:overflow-visible">
                        {message.message}
                      </TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">{getStatusBadge(message.status)}</TableCell>
                      <TableCell className="px-6 py-4 whitespace-nowrap">
                        <select
                          className="block w-full pl-3 pr-10 py-2 text-sm border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 rounded-md shadow-sm bg-white hover:border-slate-400 transition-colors"
                          value={message.status || "new"}
                          onChange={(e) => updateMessageStatus(message.id, e.target.value)}
                        >
                          <option value="new">New</option>
                          <option value="read">Read</option>
                          <option value="replied">Replied</option>
                          <option value="archived">Archived</option>
                        </select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
  );
};

export default Messages;
