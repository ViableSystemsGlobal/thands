
import { supabase } from "../supabase";

export const fetchAllProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_sizes(*)")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(p => ({ ...p, base_price: p.product_sizes[0]?.price || 0 }));
};

export const fetchProductById = async (id) => {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_sizes(*)")
    .eq("id", id)
    .single();
  if (error) throw error;
  return { ...data, base_price: data.product_sizes[0]?.price || 0 };
};

export const addProduct = async (productData, sizesData) => {
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert([productData])
    .select()
    .single();
  if (productError) throw productError;

  if (sizesData && sizesData.length > 0) {
    const sizesToInsert = sizesData.map(s => ({ ...s, product_id: product.id }));
    const { error: sizesError } = await supabase.from("product_sizes").insert(sizesToInsert);
    if (sizesError) {
      await supabase.from("products").delete().eq("id", product.id); 
      throw sizesError;
    }
  }
  return product;
};

export const updateProduct = async (id, productData, sizesData) => {
  const { data: product, error: productError } = await supabase
    .from("products")
    .update(productData)
    .eq("id", id)
    .select()
    .single();
  if (productError) throw productError;

  await supabase.from("product_sizes").delete().eq("product_id", id);
  if (sizesData && sizesData.length > 0) {
    const sizesToInsert = sizesData.map(s => ({ ...s, product_id: product.id }));
    const { error: sizesError } = await supabase.from("product_sizes").insert(sizesToInsert);
    if (sizesError) throw sizesError;
  }
  return product;
};

export const deleteProduct = async (id) => {
  await supabase.from("product_sizes").delete().eq("product_id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
};

export const fetchFeaturedProducts = async () => {
  const { data, error } = await supabase
    .from("products")
    .select("*, product_sizes(*)")
    .eq("is_featured", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return data.map(p => ({ ...p, base_price: p.product_sizes[0]?.price || 0 }));
};

export const fetchProductsByCategory = async (category) => {
    const { data, error } = await supabase
        .from('products')
        .select('*, product_sizes(*)')
        .eq('category', category)
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(p => ({ ...p, base_price: p.product_sizes[0]?.price || 0 }));
};
