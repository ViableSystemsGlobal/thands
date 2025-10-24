import { useState } from 'react';
import uploadApi from '@/lib/services/uploadApi';
import { useToast } from '@/components/ui/use-toast';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  // Upload single file
  const uploadSingle = async (file) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validate file
      const validation = uploadApi.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate progress (since we can't track real progress with fetch)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const result = await uploadApi.uploadSingle(file);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Upload Successful",
        description: "File uploaded successfully",
      });

      return result;

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Upload multiple files
  const uploadMultiple = async (files) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validate files
      const validation = uploadApi.validateFiles(files);
      if (!validation.allValid) {
        const errorMessages = validation.invalidFiles.map(f => 
          `${f.file.name}: ${f.errors.join(', ')}`
        );
        throw new Error(errorMessages.join('; '));
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 100);

      const result = await uploadApi.uploadMultiple(validation.validFiles);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Upload Successful",
        description: `${result.files.length} file(s) uploaded successfully`,
      });

      return result;

    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload files",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Update product image
  const updateProductImage = async (productId, file) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validate file
      const validation = uploadApi.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 15;
        });
      }, 100);

      const result = await uploadApi.updateProductImage(productId, file);
      
      clearInterval(progressInterval);
      setProgress(100);

      toast({
        title: "Image Updated",
        description: "Product image updated successfully",
      });

      return result;

    } catch (error) {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update product image",
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  // Delete file
  const deleteFile = async (fileId) => {
    try {
      await uploadApi.deleteFile(fileId);
      
      toast({
        title: "File Deleted",
        description: "File deleted successfully",
      });

    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete file",
        variant: "destructive",
      });
      throw error;
    }
  };

  // Get optimized image URL
  const getImageUrl = (fileId, useCase = 'display') => {
    return uploadApi.getOptimizedImageUrl(fileId, useCase);
  };

  // Validate file
  const validateFile = (file) => {
    return uploadApi.validateFile(file);
  };

  // Validate files
  const validateFiles = (files) => {
    return uploadApi.validateFiles(files);
  };

  return {
    uploading,
    progress,
    uploadSingle,
    uploadMultiple,
    updateProductImage,
    deleteFile,
    getImageUrl,
    validateFile,
    validateFiles
  };
};

export default useFileUpload;
