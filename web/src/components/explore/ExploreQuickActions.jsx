import { Camera, Heart, MessageCircle, Search, Users } from "lucide-react";

const ExploreQuickActions = ({ onActionClick }) => {
  const actions = [
    {
      id: "camera",
      icon: Camera,
      label: "Tạo",
      color: "from-purple-500 to-pink-500",
      action: () => onActionClick?.("create"),
    },
    {
      id: "search",
      icon: Search,
      label: "Khám phá",
      color: "from-blue-500 to-cyan-400",
      action: () => onActionClick?.("search"),
    },
    {
      id: "people",
      icon: Users,
      label: "Mọi người",
      color: "from-green-400 to-blue-500",
      action: () => onActionClick?.("people"),
    },
    {
      id: "trending",
      icon: Heart,
      label: "Thịnh hành",
      color: "from-red-500 to-pink-500",
      action: () => onActionClick?.("trending"),
    },
    {
      id: "reels",
      icon: MessageCircle,
      label: "Reels",
      color: "from-orange-500 to-red-500",
      action: () => onActionClick?.("reels"),
    },
  ];

  return (
    <div className="mb-6 hidden sm:block">
      <div className="flex justify-center space-x-8">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className="group flex flex-col items-center space-y-2 transition-transform hover:scale-105"
            >
              <div className={`rounded-full bg-gradient-to-r ${action.color} p-3 shadow-lg`}>
                <Icon className="h-6 w-6 text-white" />
              </div>
              <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 dark:text-gray-400 dark:group-hover:text-white">
                {action.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ExploreQuickActions;
