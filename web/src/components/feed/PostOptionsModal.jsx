import { useState } from "react";

import { AlertTriangle, Copy, Edit, Share2, UserMinus } from "lucide-react";

import OptionsModal from "@/components/common/OptionsModal";

import ConfirmPostPopup from "../popup/ConfirmPostPopup";

const PostOptionsModal = ({
  isOpen,
  onClose,
  closeModal,
  post,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onCopyLink,
  onShare,
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const isOwner = post?.user?._id === currentUserId;


  const handleDelete = () => {
    setShowConfirm(true); // mở modal xác nhận
  };

  const confirmDelete = () => {
    onDelete?.(post._id);
    setShowConfirm(false);  
    closeModal?.(); 
  };

  const cancelDelete = () => setShowConfirm(false);

  const getPostOptions = () => {
    const commonOptions = [
      { label: "Sao chép liên kết", icon: <Copy size={18} />, onClick: () => onCopyLink?.(post) },
      { label: "Chia sẻ lên...", icon: <Share2 size={18} />, onClick: () => onShare?.(post) },
    ];

    if (isOwner) {
      return [
        { label: "Chỉnh sửa", icon: <Edit size={18} />, onClick: () => onEdit?.(post) },
        ...commonOptions,
        {
          label: "Xóa",
          icon: <AlertTriangle size={18} />,
          onClick: handleDelete,
          danger: true,
        },
      ];
    } else {
      return [
        ...commonOptions,
        {
          label: "Báo cáo",
          icon: <AlertTriangle size={18} />,
          onClick: () => onReport?.(post),
          danger: true,
        },       
      ];
    }
  };

  return (
    <>
      <OptionsModal isOpen={isOpen} onClose={onClose} options={getPostOptions()} showCancel />
      {showConfirm && (
        <ConfirmPostPopup
          show={showConfirm}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </>
  );
};

export default PostOptionsModal;
