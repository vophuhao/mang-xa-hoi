import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { 
  Home, 
  Search, 
  PlusSquare, 
  Heart, 
  MessageCircle,
  Compass,
  User,
  Settings,
  LogOut,
  Moon,
  Sun
} from 'lucide-react';

import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { logoutUser } from '../../store/slices/authSlice';
import useTheme from '../../hooks/useTheme';
import { cn } from '../../lib/utils';

const Sidebar = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, changeTheme } = useTheme();
  const { user } = useSelector((state) => state.auth);
  
  const [showCreateModal, setShowCreateModal] = useState(false);

  const navigation = [
    {
      name: 'Home',
      href: '/',
      icon: Home,
    },
    {
      name: 'Search',
      href: '/search',
      icon: Search,
    },
    {
      name: 'Explore',
      href: '/explore',
      icon: Compass,
    },
    {
      name: 'Messages',
      href: '/messages',
      icon: MessageCircle,
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: Heart,
    },
    {
      name: 'Create',
      href: '/create',
      icon: PlusSquare,
      onClick: () => setShowCreateModal(true),
    },
    {
      name: 'Profile',
      href: `/profile/${user?.username}`,
      icon: User,
    },
  ];

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-800">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/logo_pixyy.png" 
                alt="Pixyy" 
                className="w-8 h-8"
              />
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Pixyy
              </span>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="lg:hidden"
            >
              ✕
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              const Icon = item.icon;
              
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={item.onClick}
                  className={cn(
                    'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors',
                    isActive
                      ? 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Profile & Settings */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-800">
            {user && (
              <div className="flex items-center space-x-3 mb-4">
                <Avatar
                  src={user.avatar}
                  alt={user.username}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.username}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="w-full justify-start"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 mr-3" />
                ) : (
                  <Moon className="w-4 h-4 mr-3" />
                )}
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/settings')}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/10"
              >
                <LogOut className="w-4 h-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
