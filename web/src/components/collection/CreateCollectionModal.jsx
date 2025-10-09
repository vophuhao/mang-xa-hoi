import { useState } from "react";

import { Lock, Unlock, X } from "lucide-react";

import { useCreateCollection } from "@/hooks/useCollection";

const CreateCollectionModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPrivate: false,
  });

  const createCollectionMutation = useCreateCollection();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return;
    }

    try {
      await createCollectionMutation.mutateAsync({
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        isPrivate: formData.isPrivate,
      });

      // Reset form and close modal on success
      setFormData({ name: "", description: "", isPrivate: false });
      onClose();
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tạo bộ sưu tập mới
          </h2>
          <button
            onClick={onClose}
            className="rounded-full p-1 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
            disabled={createCollectionMutation.isPending}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-4">
          {/* Collection Name */}
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Tên bộ sưu tập *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter collection name"
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              maxLength={100}
              required
              disabled={createCollectionMutation.isPending}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.name.length}/100
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mô tả (tùy chọn)
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả về bộ sưu tập..."
              rows={3}
              className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              maxLength={500}
              disabled={createCollectionMutation.isPending}
            />
            <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {formData.description.length}/500
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-700">
            <div className="flex items-center space-x-3">
              {formData.isPrivate ? (
                <Lock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <Unlock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-white">
                  {formData.isPrivate ? "Riêng tư" : "Công khai"}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {formData.isPrivate
                    ? "Chỉ bạn mới có thể xem bộ sưu tập này"
                    : "Ai cũng có thể xem bộ sưu tập này"}
                </div>
              </div>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input
                type="checkbox"
                name="isPrivate"
                checked={formData.isPrivate}
                onChange={handleInputChange}
                className="peer sr-only"
                disabled={createCollectionMutation.isPending}
              />
              <div className="peer h-6 w-11 rounded-full bg-gray-200 peer-checked:bg-blue-600 peer-focus:ring-4 peer-focus:ring-blue-300 peer-focus:outline-none after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white dark:border-gray-600 dark:bg-gray-600 dark:peer-focus:ring-blue-800"></div>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg bg-gray-100 px-4 py-2 font-medium text-gray-700 transition-colors hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
              disabled={createCollectionMutation.isPending}
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={createCollectionMutation.isPending || !formData.name.trim()}
            >
              {createCollectionMutation.isPending ? "Đang tạo..." : "Tạo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCollectionModal;
