# 📁 Storage Setup Guide - Fix Image Upload Issues

## 🚨 Issue Summary

If you're experiencing issues with product image uploads in the admin panel, it's likely because:
1. The `uploads` storage bucket doesn't exist in your Supabase project
2. The bucket doesn't have the correct permissions/policies
3. The storage configuration is missing

## 🔧 Step-by-Step Solution

### Step 1: Create the Storage Bucket

1. **Go to your Supabase Dashboard**
   - Visit [supabase.com](https://supabase.com)
   - Navigate to your project
   - Click on "Storage" in the left sidebar

2. **Create the 'uploads' bucket**
   - Click "Create bucket"
   - Name: `uploads`
   - Set as **Public bucket** (check the box)
   - Click "Create bucket"

### Step 2: Set Up Storage Policies

After creating the bucket, you need to set up Row Level Security (RLS) policies:

1. **Go to Storage → Policies**
2. **Click "Create Policy" for the `uploads` bucket**
3. **Create the following policies:**

#### Policy 1: Allow Public Read Access
```sql
CREATE POLICY "Public Read Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'uploads');
```

#### Policy 2: Allow Authenticated Uploads
```sql
CREATE POLICY "Authenticated Upload" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Allow Authenticated Updates
```sql
CREATE POLICY "Authenticated Update" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 4: Allow Authenticated Deletes
```sql
CREATE POLICY "Authenticated Delete" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
```

### Step 3: Alternative - Quick Setup via SQL

If you prefer, you can run this SQL in your Supabase SQL Editor:

```sql
-- Enable storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Create policies
CREATE POLICY IF NOT EXISTS "Public Read Access" ON storage.objects
FOR SELECT 
USING (bucket_id = 'uploads');

CREATE POLICY IF NOT EXISTS "Authenticated Upload" ON storage.objects
FOR INSERT 
WITH CHECK (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated Update" ON storage.objects
FOR UPDATE 
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY IF NOT EXISTS "Authenticated Delete" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'uploads' 
  AND auth.role() = 'authenticated'
);
```

### Step 4: Verify the Setup

1. **Test the Upload**
   - Go to your admin panel
   - Try to add/edit a product
   - Upload an image
   - Check if it works without errors

2. **Check Browser Console**
   - Open browser developer tools (F12)
   - Check for any error messages
   - Look for 404 errors or permission errors

### Step 5: Update Environment Variables (if needed)

Make sure your `.env` file has the correct Supabase configuration:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🔍 Troubleshooting

### Common Issues:

1. **"Bucket not found" error**
   - Solution: Create the `uploads` bucket as described above

2. **"Permission denied" error**
   - Solution: Check your storage policies and ensure they're correctly set

3. **"No public access" error**
   - Solution: Make sure the bucket is set to public

4. **Images not displaying**
   - Solution: Check that the bucket is public and the URLs are correct

### Test Your Setup:

1. **Manual Test**
   - Go to Storage → uploads bucket
   - Try to upload a file manually
   - Check if you can access the file via its public URL

2. **Code Test**
   - Open browser console
   - Run: `console.log(import.meta.env.VITE_SUPABASE_URL)`
   - Verify your environment variables are loaded

## 📂 Folder Structure

After setup, your storage will organize files like this:
```
uploads/
├── products/
│   ├── 1234567890-abc123.jpg
│   └── 1234567890-def456.png
├── consultations/
│   ├── designs/
│   └── photos/
└── [other folders as needed]
```

## ✅ Verification

After completing the setup:

1. ✅ `uploads` bucket exists and is public
2. ✅ Storage policies are correctly configured
3. ✅ Environment variables are set
4. ✅ Product image upload works in admin panel
5. ✅ Images display correctly on the frontend

## 🆘 Need Help?

If you're still having issues after following this guide:

1. Check the browser console for specific error messages
2. Verify your Supabase project settings
3. Make sure you're logged in as an admin user
4. Test with a small image file (< 1MB) first

---

**Note**: This setup is required for all image uploads in your application, including product images, user avatars, and consultation files. 