import React from "react";

export default function ConfirmPostPopup({ 
  show, 
  onConfirm, 
  onCancel 
}) {
  if (!show) return null; // Không render khi ẩn

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <div className="bg-white w-[380px] rounded-2xl overflow-hidden shadow-lg">
        {/* Nội dung */}
        <div className="p-6 text-center">
          <h3 className="text-lg font-semibold text-gray-900">xóa bài viết?</h3>
        
        </div>

        {/* Nút */}
        <div className="border-t border-gray-200">
          <button
            onClick={onConfirm}
            className="w-full py-3 text-red-500 font-semibold hover:bg-gray-50 transition cursor-pointer"
          >
            Xóa
          </button>
        </div>
        <div className="border-t border-gray-200">
          <button
            onClick={onCancel}
            className="w-full py-3 text-gray-700 font-medium hover:bg-gray-50 transition cursor-pointer"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
}
