import React, { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { motion } from "framer-motion";

const ProfileImageUpload = ({ 
  currentImage, 
  fallbackInitials, 
  onImageUpload, 
  uploading = false 
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(null);

  const handleFileSelect = (file) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    onImageUpload(file);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <motion.div
        whileHover={{ scale: 1.05 }}
        transition={{ duration: 0.2 }}
        className="relative"
      >
        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
          <AvatarImage 
            src={preview || currentImage} 
            alt="Profile picture" 
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-xl">
            {fallbackInitials}
          </AvatarFallback>
        </Avatar>
        
        {uploading && (
          <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
            <Loader2 className="h-6 w-6 text-white animate-spin" />
          </div>
        )}
        
        {preview && !uploading && (
          <Button
            size="sm"
            variant="destructive"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={clearPreview}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </motion.div>

      <div className="flex flex-col items-center space-y-2">
        <div
          className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-2">
            <Camera className="h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-700">
                Drop image here or
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-blue-600 hover:text-blue-700"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                browse files
              </Button>
            </div>
            <p className="text-xs text-gray-500">
              PNG, JPG up to 5MB
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>
    </div>
  );
};

export default ProfileImageUpload; 