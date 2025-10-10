import { useState } from "react";

import { toast } from "react-toastify";

import { analyzeMedia, uploadMedia } from "@/utils/mediaUpload";

export const useMediaUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadWithProgress = async (files, options = {}) => {
    const { showToast = true, analyzeImages = false, onProgress } = options;

    setIsUploading(true);
    setUploadProgress(0);

    let toastId;

    try {
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = Math.min(prev + Math.random() * 20, 90);
          if (onProgress) onProgress(newProgress);
          return newProgress;
        });
      }, 200);

      // Upload files
      const uploadedUrls = await uploadMedia(files);

      setUploadProgress(95);
      if (onProgress) onProgress(95);

      let suggestedHashtags = [];

      // Analyze images if requested
      if (analyzeImages) {
        const imageFiles = Array.isArray(files)
          ? files.filter((file) => file.type.startsWith("image/"))
          : [files].filter((file) => file.type.startsWith("image/"));

        if (imageFiles.length > 0) {
          try {
            suggestedHashtags = await analyzeMedia(imageFiles);
          } catch (error) {
            console.warn("Failed to analyze media:", error);
            // Continue without hashtags if analysis fails
          }
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);
      if (onProgress) onProgress(100);

      if (showToast && toastId) {
        toast.success("Upload thành công!", { id: toastId });
      }

      return {
        urls: uploadedUrls,
        hashtags: suggestedHashtags,
      };
    } catch (error) {
      console.error("Media upload failed:", error);

      if (showToast && toastId) {
        toast.error("Upload thất bại. Vui lòng thử lại!", { id: toastId });
      }

      throw error;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadWithProgress,
    isUploading,
    uploadProgress,
  };
};
