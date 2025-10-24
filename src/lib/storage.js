
import { supabase } from './supabase';

export const uploadProductImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload the file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { error: uploadError.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      return { error: 'Failed to get public URL for uploaded image' };
    }

    return { url: publicUrl };
  } catch (error) {
    console.error('Upload error:', error);
    return { error: `Failed to upload image: ${error.message}` };
  }
};

export const deleteProductImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const filePath = `products/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

export const uploadHeroImage = async (file) => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `hero-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `hero/${fileName}`;

    // Upload the file to Supabase storage
    const { data, error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Hero image upload error:', uploadError);
      return { error: uploadError.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    if (!publicUrl) {
      return { error: 'Failed to get public URL for uploaded hero image' };
    }

    return { url: publicUrl };
  } catch (error) {
    console.error('Hero image upload error:', error);
    return { error: `Failed to upload hero image: ${error.message}` };
  }
};

export const deleteHeroImage = async (imageUrl) => {
  try {
    if (!imageUrl) return;

    // Extract the file path from the URL
    const urlParts = imageUrl.split('/');
    const filePath = `hero/${urlParts[urlParts.length - 1]}`;

    const { error } = await supabase.storage
      .from('uploads')
      .remove([filePath]);

    if (error) {
      console.error('Hero image delete error:', error);
      throw error;
    }
  } catch (error) {
    console.error('Hero image delete error:', error);
    throw new Error(`Failed to delete hero image: ${error.message}`);
  }
};
