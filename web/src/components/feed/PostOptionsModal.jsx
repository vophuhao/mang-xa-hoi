import { AlertTriangle, Copy, Edit, Share2, UserMinus } from "lucide-react";

import OptionsModal from "@/components/common/OptionsModal";

const PostOptionsModal = ({
  isOpen,
  onClose,
  post,
  currentUserId,
  onEdit,
  onDelete,
  onReport,
  onCopyLink,
  onShare,
}) => {
  const isOwner = post?.user?._id === currentUserId;

  const getPostOptions = () => {
    const commonOptions = [
      {
        label: "Sao chép liên kết",
        icon: <Copy size={18} />,
        onClick: () => onCopyLink?.(post),
      },
      {
        label: "Chia sẻ lên...",
        icon: <Share2 size={18} />,
        onClick: () => onShare?.(post),
      },
    ];

    if (isOwner) {
      return [
        {
          label: "Chỉnh sửa",
          icon: <Edit size={18} />,
          onClick: () => onEdit?.(post),
        },
        ...commonOptions,
        {
          label: "Xóa",
          icon: <AlertTriangle size={18} />,
          onClick: () => onDelete?.(post._id),
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
        {
          label: "Bỏ theo dõi",
          icon: <UserMinus size={18} />,
          onClick: () => console.log("Unfollow user"),
          danger: true,
        },
      ];
    }
  };

  return (
    <OptionsModal isOpen={isOpen} onClose={onClose} options={getPostOptions()} showCancel={true} />
  );
};

export default PostOptionsModal;
