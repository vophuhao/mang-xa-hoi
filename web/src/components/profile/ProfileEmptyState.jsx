import { Camera, Heart, MessageCircle } from "lucide-react";

const ProfileEmptyState = ({ type, isOwnProfile, onCreatePost }) => {
  const getEmptyStateConfig = () => {
    switch (type) {
      case "posts":
        return {
          icon: Camera,
          title: "Chia sẻ ảnh",
          description: isOwnProfile
            ? "Khi bạn chia sẻ ảnh, ảnh sẽ xuất hiện trên trang cá nhân của bạn."
            : "Người dùng này chưa chia sẻ ảnh nào.",
          actionText: isOwnProfile ? "Chia sẻ ảnh đầu tiên của bạn" : null,
          onAction: onCreatePost,
        };
      case "saved":
        return {
          icon: Heart,
          title: "Lưu những gì bạn muốn xem lại",
          description: "Bạn chỉ có thể xem những gì mình đã lưu.",
          actionText: null,
          onAction: null,
        };
      case "tagged":
        return {
          icon: MessageCircle,
          title: "Ảnh có gắn thẻ bạn",
          description: isOwnProfile
            ? "Khi có ai đó gắn thẻ bạn trong ảnh, ảnh đó sẽ xuất hiện ở đây."
            : "Khi có ai đó gắn thẻ người này trong ảnh, ảnh đó sẽ xuất hiện ở đây.",
          actionText: null,
          onAction: null,
        };
      default:
        return {
          icon: Camera,
          title: "Chưa có nội dung",
          description: "Nội dung sẽ xuất hiện ở đây.",
          actionText: null,
          onAction: null,
        };
    }
  };

  const config = getEmptyStateConfig();
  const Icon = config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6 rounded-full border-2 border-gray-900 p-6 dark:border-white">
        <Icon className="h-12 w-12 text-gray-900 dark:text-white" />
      </div>
      <h3 className="mb-3 text-2xl font-light text-gray-900 dark:text-white">{config.title}</h3>
      <p className="mb-6 max-w-sm text-sm text-gray-600 dark:text-gray-400">{config.description}</p>
      {config.actionText && config.onAction && (
        <button
          onClick={config.onAction}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          {config.actionText}
        </button>
      )}
    </div>
  );
};

export default ProfileEmptyState;
