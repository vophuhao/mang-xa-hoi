import { useState } from "react";
import { Grid3x3, Bookmark, Settings, Tag, Heart, MessageCircle } from "lucide-react";
import useAuth from "../hooks/useAuth";

export default function ProfilePanel() {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isStoryHovered, setIsStoryHovered] = useState(false);
  
  // Kết hợp dữ liệu người dùng từ API với dữ liệu mẫu
  const profileData = {
    username: user?.name || "User",
    fullName: user?.name || "User A",
    email: user?.email || "example@email.com",
    bio: user?.bio || "📸 Nhiếp ảnh gia | 🌍 Du lịch khắp thế giới\nLiên hệ: " + (user?.email || "example@email.com"),
    postsCount: 24,
    followersCount: 1250,
    followingCount: 568,
    profileImage: user?.avatarUrl || "https://images.unsplash.com/photo-1633332755192-727a05c4013d",
    verified: user?.verified || false,
    provider: user?.provider || "local",
    createdAt: user?.createdAt?.$date ? new Date(user.createdAt.$date) : new Date(),
    stories: [
      { id: 1, title: "Du lịch", thumbnail: "https://images.unsplash.com/photo-1527631746610-bca00a040d60" },
      { id: 2, title: "Ẩm thực", thumbnail: "https://images.unsplash.com/photo-1504674900247-0877df9cc836" },
      { id: 3, title: "Thời trang", thumbnail: "https://images.unsplash.com/photo-1445205170230-053b83016050" },
    ],
    posts: [
      { 
        id: 1, 
        imageUrl: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b",
        likes: 256,
        comments: 42
      },
      { 
        id: 2, 
        imageUrl: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4",
        likes: 198,
        comments: 36
      },
      { 
        id: 3, 
        imageUrl: "https://images.unsplash.com/photo-1682687982501-1e58ab814714",
        likes: 432,
        comments: 65
      },
      { 
        id: 4, 
        imageUrl: "https://images.unsplash.com/photo-1682687218147-9806132dc697",
        likes: 321,
        comments: 28
      },
      { 
        id: 5, 
        imageUrl: "https://images.unsplash.com/photo-1682687982360-3fbcceb77630",
        likes: 287,
        comments: 39
      },
      { 
        id: 6, 
        imageUrl: "https://images.unsplash.com/photo-1682687982093-4ca1a2bd9ae8",
        likes: 176,
        comments: 24
      },
    ],
    savedPosts: [],
    taggedPosts: []
  };

  // Các tab trong profile
  const tabs = [
    { icon: <Grid3x3 size={16} />, label: "BÀI VIẾT", content: profileData.posts },
    { icon: <Bookmark size={16} />, label: "ĐÃ LƯU", content: profileData.savedPosts },
    { icon: <Tag size={16} />, label: "ĐƯỢC GẮN THẺ", content: profileData.taggedPosts }
  ];

  // Hiển thị loading khi đang tải dữ liệu
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-default"></div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 p-4 font-bold border-b bg-white flex items-center justify-between">
        <h1 className="text-xl">Trang cá nhân</h1>
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
        >
          <Settings size={20} />
        </button>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start mb-8 space-y-4 md:space-y-0 md:space-x-8">
          {/* Avatar with Story Ring */}
          <div 
            className="relative group"
            onMouseEnter={() => setIsStoryHovered(true)}
            onMouseLeave={() => setIsStoryHovered(false)}
          >
            <div className={`rounded-full p-[3px] transition-all duration-300 ${profileData.stories.length > 0 ? 'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500' : ''}`}>
              <div className="rounded-full p-[2px] bg-white">
                <img 
                  src={profileData.profileImage} 
                  alt={profileData.fullName}
                  className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover"
                />
              </div>
            </div>
            {profileData.stories.length > 0 && (
              <div className={`absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center transition-opacity duration-300 ${isStoryHovered ? 'opacity-100' : 'opacity-0'}`}>
                <span className="text-white text-sm font-medium">Xem story</span>
              </div>
            )}
          </div>
          
          {/* Profile Info */}
          <div className="flex-1 flex flex-col items-center md:items-start">
            {/* Username and Edit Button */}
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-3 md:space-y-0 md:space-x-4 w-full mb-4">
              <h2 className="text-xl font-medium">
                {profileData.username}
                {profileData.verified && (
                  <span className="inline-block ml-1 text-blue-500" title="Đã xác minh">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                      <path fillRule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                    </svg>
                  </span>
                )}
              </h2>
              <div className="flex space-x-2">
                <button className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md font-medium text-sm transition-colors duration-200">
                  Chỉnh sửa trang cá nhân
                </button>
                <button className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors duration-200">
                  <Settings size={18} />
                </button>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex space-x-8 mb-4">
              <div className="flex flex-col items-center md:items-start">
                <span className="font-semibold">{profileData.postsCount}</span>
                <span className="text-sm text-gray-500">bài viết</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="font-semibold">{profileData.followersCount}</span>
                <span className="text-sm text-gray-500">người theo dõi</span>
              </div>
              <div className="flex flex-col items-center md:items-start">
                <span className="font-semibold">{profileData.followingCount}</span>
                <span className="text-sm text-gray-500">đang theo dõi</span>
              </div>
            </div>
            
            {/* Full Name and Bio */}
            <div className="text-center md:text-left">
              <h3 className="font-semibold">{profileData.fullName}</h3>
              <p className="text-sm whitespace-pre-line">{profileData.bio}</p>
              {/* Thông tin bổ sung */}
              <div className="mt-2 text-xs text-gray-500">
                <p>Email: {profileData.email}</p>
                <p>Đăng nhập qua: {profileData.provider === 'google' ? 'Google' : 'Email/Password'}</p>
                <p>Tham gia: {profileData.createdAt.toLocaleDateString('vi-VN')}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Stories Highlights */}
        {profileData.stories.length > 0 && (
          <div className="mb-8 overflow-x-auto">
            <div className="flex space-x-5 pb-2">
              {profileData.stories.map(story => (
                <div key={story.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
                  <div className="rounded-full p-[2px] bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500">
                    <div className="rounded-full p-[2px] bg-white">
                      <img 
                        src={story.thumbnail} 
                        alt={story.title}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <span className="text-xs">{story.title}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="border-t">
          <div className="flex justify-around">
            {tabs.map((tab, index) => (
              <button 
                key={index}
                className={`flex items-center justify-center space-x-1.5 py-3 px-4 text-xs font-medium transition-all duration-200 ${activeTab === index ? 'text-black border-t border-black -mt-[1px]' : 'text-gray-400'}`}
                onClick={() => setActiveTab(index)}
              >
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
          
          {/* Tab Content */}
          <div className="py-4">
            {tabs.map((tab, index) => (
              <div key={index} className={activeTab === index ? 'block' : 'hidden'}>
                {tab.content && tab.content.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1">
                    {tab.content.map((post) => (
                      <div key={post.id} className="relative group pb-[100%] bg-gray-100 overflow-hidden">
                        <img 
                          src={post.imageUrl}
                          alt="Post"
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-40 transition-opacity duration-300 flex items-center justify-center">
                          <div className="flex items-center space-x-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <div className="flex items-center">
                              <Heart size={20} fill="white" className="mr-1" />
                              <span>{post.likes}</span>
                            </div>
                            <div className="flex items-center">
                              <MessageCircle size={20} fill="white" className="mr-1" />
                              <span>{post.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    {index === 0 && (
                      <>
                        <div className="text-5xl mb-4">📷</div>
                        <p className="text-sm font-light mb-1">Chưa có bài viết</p>
                        <p className="text-xs text-gray-400">Bài viết bạn chia sẻ sẽ xuất hiện ở đây</p>
                      </>
                    )}
                    {index === 1 && (
                      <>
                        <div className="text-5xl mb-4">🔖</div>
                        <p className="text-sm font-light mb-1">Chưa có mục đã lưu</p>
                        <p className="text-xs text-gray-400">Lưu ảnh và video bạn muốn xem lại</p>
                      </>
                    )}
                    {index === 2 && (
                      <>
                        <div className="text-5xl mb-4">🏷️</div>
                        <p className="text-sm font-light mb-1">Chưa có ảnh</p>
                        <p className="text-xs text-gray-400">Khi mọi người gắn thẻ bạn, ảnh sẽ xuất hiện ở đây</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div 
            className="bg-white rounded-xl w-full max-w-sm overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center py-3 border-b font-medium">Cài đặt</div>
            <button 
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setIsSettingsOpen(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div>
              <button className="w-full text-left py-3.5 px-4 border-b hover:bg-gray-50 transition-colors duration-200">
                Đổi mật khẩu
              </button>
              <button className="w-full text-left py-3.5 px-4 border-b hover:bg-gray-50 transition-colors duration-200">
                Ứng dụng và trang web
              </button>
              <button className="w-full text-left py-3.5 px-4 border-b hover:bg-gray-50 transition-colors duration-200">
                Thông báo
              </button>
              <button className="w-full text-left py-3.5 px-4 border-b hover:bg-gray-50 transition-colors duration-200">
                Quyền riêng tư và bảo mật
              </button>
              <button className="w-full text-left py-3.5 px-4 text-red-500 hover:bg-gray-50 transition-colors duration-200">
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}