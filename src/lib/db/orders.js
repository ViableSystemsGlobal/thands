
import { supabase } from "../supabase";

export const fetchOrdersForAdmin = async (filters) => {
  const { dateRange, statusFilter, searchQuery } = filters;
  
  let query = supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      order_items (
        *,
        products (*),
        gift_voucher_types (*)
      )
    `)
    .order('created_at', { ascending: false });

  if (dateRange.start) {
    query = query.gte('created_at', dateRange.start.toISOString());
  }
  if (dateRange.end) {
    query = query.lte('created_at', dateRange.end.toISOString());
  }

  if (statusFilter && statusFilter !== "all") {
     if (statusFilter === "completed") {
        query = query.eq('status', 'delivered').eq('payment_status', 'paid');
      } else if (statusFilter === "in-progress") {
        query = query.or(`payment_status.eq.paid,and(status.in.("processing","shipped"),payment_status.eq.pending,status.neq.cancelled)`);
      } else if (statusFilter === "pending_payment") {
        query = query.eq('payment_status', 'pending').neq('status', 'cancelled');
      } else {
        query = query.eq('status', statusFilter);
      }
  }
  
  if (searchQuery) {
    const searchLower = `%${searchQuery.toLowerCase()}%`;
    query = query.or(
      `order_number.ilike.${searchLower},` +
      `customers.first_name.ilike.${searchLower},customers.last_name.ilike.${searchLower},customers.email.ilike.${searchLower},` +
      `shipping_first_name.ilike.${searchLower},shipping_last_name.ilike.${searchLower},shipping_email.ilike.${searchLower}`
    );
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};


export const fetchOrderByIdForAdmin = async (orderId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      customers (*),
      order_items (
        *,
        products (*),
        gift_voucher_types (*)
      )
    `)
    .eq('id', orderId)
    .single();
  if (error) throw error;
  return data;
};

export const updateOrderStatusForAdmin = async (orderId, status) => {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const fetchOrdersByUserId = async (userId) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      order_items (
        *,
        products (name, image_url),
        gift_voucher_types (name)
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};
