import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Menu, Heart, MessageCircle } from 'lucide-react';

import Avatar from '../ui/Avatar';
import Button from '../ui/Button';

const MobileHeader = ({ onMenuClick }) => {
  const { user } = useSelector((state) => state.auth);

  return (
    <header className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center justify-between h-16 px-4">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMenuClick}
          >
            <Menu className="w-5 h-5" />
          </Button>
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
        </div>

        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm">
            <Heart className="w-5 h-5" />
          </Button>
          <Button variant="ghost" size="sm">
            <MessageCircle className="w-5 h-5" />
          </Button>
          {user && (
            <Link to={`/profile/${user.username}`}>
              <Avatar
                src={user.avatar}
                alt={user.username}
                size="sm"
              />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default MobileHeader;
