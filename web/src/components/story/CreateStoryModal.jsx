import { useRef, useState } from "react";

import { Camera, Image, Palette, Type, Upload, Video, X } from "lucide-react";
import { toast } from "react-toastify";

import HashtagSuggestions from "@/components/ui/HashtagSuggestions";
import ProgressBar from "@/components/ui/ProgressBar";
import { useMediaUpload } from "@/hooks/useMediaUpload";
import { useStoryActions } from "@/hooks/useStory";

const CreateStoryModal = ({ isOpen, onClose }) => {
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [caption, setCaption] = useState("");
  const [backgroundColor, setBackgroundColor] = useState("#000000");
  const [isTextMode, setIsTextMode] = useState(false);
  const [textContent, setTextContent] = useState("");
  const [suggestedHashtags, setSuggestedHashtags] = useState([]);
  const [selectedHashtags, setSelectedHashtags] = useState([]);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState(null);

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const { createStory, isCreating } = useStoryActions();
  const { uploadWithProgress, isUploading, uploadProgress } = useMediaUpload();

  const colors = [
    "#000000",
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8C471",
  ];

  const handleFileSelect = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setMediaFile(file);
      setMediaPreview(e.target.result);
      setMediaType(type);
      setIsTextMode(false);

      // Reset hashtags when new file selected
      setSuggestedHashtags([]);
      setSelectedHashtags([]);
      setUploadedMediaUrl(null);
    };
    reader.readAsDataURL(file);
  };

  const handleTextMode = () => {
    setIsTextMode(true);
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType("text");
    setSuggestedHashtags([]);
    setSelectedHashtags([]);
  };

  const handleHashtagSelect = (hashtag) => {
    if (!selectedHashtags.includes(hashtag)) {
      setSelectedHashtags([...selectedHashtags, hashtag]);
    }
  };

  const handleHashtagRemove = (hashtag) => {
    setSelectedHashtags(selectedHashtags.filter((tag) => tag !== hashtag));
  };

  const handleUploadMedia = async () => {
    if (!mediaFile) return;

    try {
      const { urls, hashtags } = await uploadWithProgress(mediaFile, {
        analyzeImages: true,
        showToast: true,
      });

      setUploadedMediaUrl(urls[0]);

      // Set suggested hashtags from analysis
      if (hashtags && hashtags.length > 0) {
        setSuggestedHashtags(hashtags);
      }
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Không thể upload media. Vui lòng thử lại!");
    }
  };

  const handleCreateStory = async () => {
    try {
      if (isTextMode && textContent.trim()) {
        // For text stories, we'd need to generate an image with the text
        // For now, we'll just use the text as caption
        const storyData = {
          mediaUrl: `data:image/svg+xml;base64,${btoa(`
            <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
              <rect width="100%" height="100%" fill="${backgroundColor}"/>
              <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" 
                    fill="white" font-size="24" font-family="Arial">
                ${textContent}
              </text>
            </svg>
          `)}`,
          mediaType: "image",
          caption: textContent.trim(),
        };

        // Only add backgroundColor if it's not the default
        if (backgroundColor && backgroundColor !== "#000000") {
          storyData.backgroundColor = backgroundColor;
        }

        await createStory(storyData);
      } else if (mediaFile) {
        // Check if media is already uploaded
        let mediaUrl = uploadedMediaUrl;

        if (!mediaUrl) {
          // Upload media first if not already uploaded
          try {
            const { urls, hashtags } = await uploadWithProgress(mediaFile, {
              analyzeImages: true,
              showToast: true,
            });

            mediaUrl = urls[0];

            // Set suggested hashtags from analysis if not already set
            if (hashtags && hashtags.length > 0 && suggestedHashtags.length === 0) {
              setSuggestedHashtags(hashtags);
            }
          } catch (error) {
            console.error("Upload failed:", error);
            toast.error("Không thể upload media. Vui lòng thử lại!");
            return; // Don't close modal on upload error
          }
        }

        const storyData = {
          mediaUrl: mediaUrl,
          mediaType: mediaType === "video" ? "video" : "image",
        };

        // Only add caption if it has content
        let finalCaption = caption.trim();

        // Add selected hashtags to caption
        if (selectedHashtags.length > 0) {
          const hashtagString = selectedHashtags.map((tag) => `#${tag}`).join(" ");
          finalCaption = finalCaption ? `${finalCaption} ${hashtagString}` : hashtagString;
        }

        if (finalCaption) {
          storyData.caption = finalCaption;
        }

        await createStory(storyData);
      }

      handleClose();
    } catch (error) {
      console.error("Failed to create story:", error);
      toast.error("Không thể tạo story. Vui lòng thử lại!");
    }
  };

  const handleClose = () => {
    setMediaFile(null);
    setMediaPreview(null);
    setMediaType(null);
    setCaption("");
    setTextContent("");
    setIsTextMode(false);
    setBackgroundColor("#000000");
    setSuggestedHashtags([]);
    setSelectedHashtags([]);
    setUploadedMediaUrl(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-h-[90vh] w-full max-w-lg overflow-hidden rounded-2xl bg-white dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b p-4 dark:border-gray-700">
            <h2 className="text-lg font-semibold dark:text-white">Tạo Story</h2>
            <button
              onClick={handleClose}
              className="rounded-full p-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={isCreating}
            >
              <X size={20} className="text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          <div className="max-h-[calc(90vh-100px)] overflow-y-auto">
            {/* Content Area */}
            {!mediaPreview && !isTextMode ? (
              /* Upload Options */
              <div className="space-y-4 p-6">
                <div className="grid grid-cols-2 gap-4">
                  {/* Photo Upload */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400"
                  >
                    <Image size={32} className="mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Thêm ảnh
                    </span>
                  </button>

                  {/* Video Upload */}
                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400"
                  >
                    <Video size={32} className="mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Thêm video
                    </span>
                  </button>

                  {/* Camera (placeholder) */}
                  <button
                    className="flex cursor-not-allowed flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 opacity-50 transition-colors hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400"
                    disabled
                  >
                    <Camera size={32} className="mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Camera
                    </span>
                    <span className="text-xs text-gray-500">Sắp có</span>
                  </button>

                  {/* Text Story */}
                  <button
                    onClick={handleTextMode}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6 transition-colors hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-400"
                  >
                    <Type size={32} className="mb-2 text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Tạo văn bản
                    </span>
                  </button>
                </div>

                {/* Hidden file inputs */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileSelect(e, "image")}
                  className="hidden"
                />
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileSelect(e, "video")}
                  className="hidden"
                />
              </div>
            ) : (
              /* Preview & Edit */
              <div className="space-y-4 p-4">
                {/* Media Preview */}
                <div className="relative">
                  <div
                    className="aspect-[9/16] max-h-96 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-800"
                    style={{ backgroundColor: isTextMode ? backgroundColor : undefined }}
                  >
                    {isTextMode ? (
                      <div className="flex h-full items-center justify-center p-6">
                        <textarea
                          value={textContent}
                          onChange={(e) => setTextContent(e.target.value)}
                          placeholder="Nhập nội dung..."
                          className="h-full w-full resize-none bg-transparent text-center text-xl font-medium text-white placeholder-white/70 outline-none"
                          style={{ color: backgroundColor === "#000000" ? "white" : "black" }}
                          maxLength={150}
                        />
                      </div>
                    ) : mediaType === "video" ? (
                      <video src={mediaPreview} className="h-full w-full object-cover" controls />
                    ) : (
                      <img
                        src={mediaPreview}
                        alt="Story preview"
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  {/* Remove media button */}
                  <button
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                      setMediaType(null);
                      setIsTextMode(false);
                      setTextContent("");
                      setSuggestedHashtags([]);
                      setSelectedHashtags([]);
                      setUploadedMediaUrl(null);
                    }}
                    className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white hover:bg-black/70"
                  >
                    <X size={16} />
                  </button>

                  {/* Upload Status Badge */}
                  {uploadedMediaUrl && (
                    <div className="absolute top-2 left-2 flex items-center space-x-1 rounded-full bg-green-500 px-2 py-1 text-xs font-medium text-white">
                      <div className="h-2 w-2 rounded-full bg-white"></div>
                      <span>Đã upload</span>
                    </div>
                  )}
                </div>

                {/* Color Picker for Text Mode */}
                {isTextMode && (
                  <div>
                    <div className="mb-2 flex items-center space-x-2">
                      <Palette size={16} className="text-gray-600 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Màu nền
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {colors.map((color) => (
                        <button
                          key={color}
                          onClick={() => setBackgroundColor(color)}
                          className={`h-8 w-8 rounded-full border-2 ${
                            backgroundColor === color
                              ? "border-blue-500"
                              : "border-gray-300 dark:border-gray-600"
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload and Analyze Button for Media */}
                {!isTextMode && mediaFile && !uploadedMediaUrl && !isUploading && (
                  <div className="space-y-2">
                    <button
                      onClick={handleUploadMedia}
                      className="flex w-full items-center justify-center space-x-2 rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2 text-white transition-all duration-200 hover:from-purple-600 hover:to-blue-600"
                    >
                      <Upload size={16} />
                      <span>Upload và phân tích hashtag</span>
                    </button>
                    <p className="text-center text-xs text-gray-500">
                      Upload trước để nhận đề xuất hashtag cho ảnh của bạn
                    </p>
                  </div>
                )}

                {/* Caption Input */}
                {!isTextMode && (
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Mô tả (tùy chọn)
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Viết mô tả cho story của bạn..."
                      className="w-full resize-none rounded-lg border border-gray-300 bg-white p-3 text-gray-900 placeholder-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                      rows={3}
                      maxLength={500}
                    />
                    <div className="mt-1 text-xs text-gray-500">{caption.length}/500</div>
                  </div>
                )}

                {/* Hashtag Suggestions */}
                {suggestedHashtags.length > 0 && (
                  <HashtagSuggestions
                    hashtags={suggestedHashtags}
                    selectedHashtags={selectedHashtags}
                    onSelect={handleHashtagSelect}
                    onRemove={handleHashtagRemove}
                  />
                )}

                {/* Character counter for text mode */}
                {isTextMode && (
                  <div className="text-center text-xs text-gray-500">{textContent.length}/150</div>
                )}

                {/* Upload Progress */}
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Đang upload...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <ProgressBar progress={uploadProgress} />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={handleClose}
                    className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                    disabled={isCreating || isUploading}
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleCreateStory}
                    disabled={
                      isCreating ||
                      isUploading ||
                      (isTextMode && !textContent.trim()) ||
                      (!isTextMode && !mediaFile)
                    }
                    className="flex flex-1 items-center justify-center space-x-2 rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isCreating || isUploading ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>{isUploading ? "Đang upload..." : "Đang tạo..."}</span>
                      </>
                    ) : (
                      <>
                        <Upload size={16} />
                        <span>Chia sẻ Story</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
