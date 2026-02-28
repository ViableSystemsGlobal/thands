import React, { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import adminApiClient from "@/lib/services/adminApiClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import {
  Loader2,
  Mail,
  Send,
  X,
  ChevronDown,
  ChevronUp,
  Reply,
  Clock,
  User,
} from "lucide-react";

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_STYLES = {
  new:      "bg-blue-100 text-blue-800",
  read:     "bg-green-100 text-green-800",
  replied:  "bg-purple-100 text-purple-800",
  archived: "bg-gray-100 text-gray-800",
};

function StatusBadge({ status }) {
  return (
    <Badge className={`${STATUS_STYLES[status] || STATUS_STYLES.new} capitalize`}>
      {status || "new"}
    </Badge>
  );
}

// ─── Reply Panel ──────────────────────────────────────────────────────────────

function ReplyPanel({ message, onClose, onReplySent }) {
  const { toast } = useToast();
  const [replyBody, setReplyBody]     = useState("");
  const [sending, setSending]         = useState(false);
  const [replies, setReplies]         = useState([]);
  const [loadingReplies, setLoading]  = useState(true);
  const textareaRef = useRef(null);

  useEffect(() => {
    fetchReplies();
    // Auto-focus compose
    setTimeout(() => textareaRef.current?.focus(), 100);
  }, [message.id]);

  const fetchReplies = async () => {
    try {
      const res = await adminApiClient.get(`/messages/${message.id}/replies`);
      setReplies(res.data?.replies || []);
    } catch {
      setReplies([]);
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async () => {
    if (!replyBody.trim()) return;
    setSending(true);
    try {
      await adminApiClient.post(`/messages/${message.id}/reply`, { reply_body: replyBody });
      toast({ title: "Reply sent", description: `Email sent to ${message.email}` });
      setReplyBody("");
      onReplySent(message.id);
      fetchReplies();
    } catch (err) {
      toast({
        title: "Failed to send",
        description: err.response?.data?.error || err.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white shadow-2xl flex flex-col h-full overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <div>
            <p className="font-semibold text-gray-900 text-sm">{message.name}</p>
            <p className="text-xs text-gray-500">{message.email}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Original message */}
        <div className="px-6 py-4 border-b bg-amber-50/40">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wide mb-2">
            Original Message · {format(new Date(message.created_at), "MMM d, yyyy, h:mm a")}
          </p>
          <p className="text-sm font-medium text-gray-800 mb-1">{message.subject}</p>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{message.message}</p>
        </div>

        {/* Reply thread */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {loadingReplies ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : replies.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">No replies yet</p>
          ) : (
            replies.map((r) => (
              <div key={r.id} className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                <div className="flex items-center gap-2 mb-2 text-xs text-purple-600">
                  <User className="h-3.5 w-3.5" />
                  <span className="font-medium">{r.sent_by_name || "Admin"}</span>
                  <Clock className="h-3.5 w-3.5 ml-2" />
                  <span>{format(new Date(r.sent_at), "MMM d, yyyy, h:mm a")}</span>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{r.reply_body}</p>
              </div>
            ))
          )}
        </div>

        {/* Compose */}
        <div className="px-6 py-4 border-t bg-white space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1">
            <Reply className="h-3.5 w-3.5" /> Reply to {message.name}
          </p>
          <Textarea
            ref={textareaRef}
            rows={5}
            placeholder={`Hi ${message.name},\n\nThank you for reaching out...`}
            value={replyBody}
            onChange={(e) => setReplyBody(e.target.value)}
            className="resize-none text-sm"
          />
          <div className="flex justify-end">
            <Button
              onClick={sendReply}
              disabled={sending || !replyBody.trim()}
              className="bg-[#D2B48C] hover:bg-[#C4A484] text-white"
            >
              {sending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending…</>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Send Reply</>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const Messages = () => {
  const [messages, setMessages]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [pagination, setPagination]     = useState({ total: 0, page: 1, limit: 15, totalPages: 1 });
  const [activeMessage, setActiveMessage] = useState(null);
  const [expandedId, setExpandedId]     = useState(null);
  const { toast } = useToast();

  useEffect(() => { fetchMessages(); }, [pagination.page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await adminApiClient.get(`/messages?page=${pagination.page}&limit=${pagination.limit}`);
      setMessages(res.data?.messages || []);
      setPagination(p => ({ ...p, ...(res.data?.pagination || {}) }));
    } catch {
      toast({ title: "Error", description: "Failed to load messages", variant: "destructive" });
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await adminApiClient.put(`/messages/${id}`, { status });
      setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status } : m));
    } catch {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  // Called after a reply is sent — flip local status to 'replied'
  const handleReplySent = (id) => {
    setMessages(msgs => msgs.map(m => m.id === id ? { ...m, status: "replied" } : m));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-gray-100">
        <Loader2 className="h-10 w-10 animate-spin text-[#D2B48C]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gradient-to-br from-slate-50 to-gray-100 min-h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-gray-800">Contact Messages</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {pagination.total} message{pagination.total !== 1 ? "s" : ""} · click a row to reply
        </p>
      </div>

      {messages.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl shadow">
          <Mail className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-gray-500">No messages yet</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {messages.map((msg) => {
              const isExpanded = expandedId === msg.id;
              return (
                <div key={msg.id} className={`transition-colors ${msg.status === "new" ? "bg-blue-50/40" : ""}`}>
                  {/* Row */}
                  <div
                    className="flex items-start gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50"
                    onClick={() => setExpandedId(isExpanded ? null : msg.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-medium text-sm text-gray-900">{msg.name}</span>
                        <span className="text-xs text-gray-400">{msg.email}</span>
                        <StatusBadge status={msg.status} />
                        <span className="text-xs text-gray-400 ml-auto">
                          {format(new Date(msg.created_at), "MMM d, yyyy")}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-700">{msg.subject}</p>
                      <p className="text-sm text-gray-500 truncate">{msg.message}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {/* Expanded actions */}
                  {isExpanded && (
                    <div className="px-6 pb-4 flex items-center gap-3 border-t border-slate-100 pt-3 bg-slate-50/50">
                      <Button
                        size="sm"
                        className="bg-[#D2B48C] hover:bg-[#C4A484] text-white"
                        onClick={(e) => { e.stopPropagation(); setActiveMessage(msg); }}
                      >
                        <Reply className="mr-1.5 h-3.5 w-3.5" /> Reply
                      </Button>

                      <select
                        className="text-xs border border-slate-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#D2B48C]"
                        value={msg.status || "new"}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => { e.stopPropagation(); updateStatus(msg.id, e.target.value); }}
                      >
                        <option value="new">New</option>
                        <option value="read">Read</option>
                        <option value="replied">Replied</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <p className="text-sm text-gray-500">
                Page {pagination.page} of {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline" size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reply slide-over panel */}
      {activeMessage && (
        <ReplyPanel
          message={activeMessage}
          onClose={() => setActiveMessage(null)}
          onReplySent={handleReplySent}
        />
      )}
    </div>
  );
};

export default Messages;
