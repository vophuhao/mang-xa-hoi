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
        onClick: () => onCopyLink?.(post),
      },
      {
        label: "Chia sẻ lên...",
        onClick: () => onShare?.(post),
      },
    ];

    if (isOwner) {
      return [
        {
          label: "Chỉnh sửa",
          onClick: () => onEdit?.(post),
        },
        ...commonOptions,
        {
          label: "Xóa",
          onClick: () => onDelete?.(post._id),
          danger: true,
        },
      ];
    } else {
      return [
        ...commonOptions,
        {
          label: "Báo cáo",
          onClick: () => onReport?.(post),
          danger: true,
        },
        {
          label: "Bỏ theo dõi",
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
