import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchSuggestedUsers, followUser } from '../../store/slices/userSlice';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';

const SuggestedUsers = () => {
  const dispatch = useDispatch();
  const { suggestedUsers, currentUser } = useSelector((state) => state.users);

  useEffect(() => {
    dispatch(fetchSuggestedUsers());
  }, [dispatch]);

  const handleFollow = (userId) => {
    dispatch(followUser(userId));
  };

  if (suggestedUsers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Suggested for you</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {suggestedUsers.slice(0, 5).map((user) => (
          <div key={user._id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
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
                  {user.fullName || user.email}
                </p>
              </div>
            </div>
            
            {user._id !== currentUser?._id && (
              <Button
                size="sm"
                variant={user.isFollowing ? "secondary" : "primary"}
                onClick={() => handleFollow(user._id)}
              >
                {user.isFollowing ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        ))}
        
        <div className="pt-2">
          <Button variant="ghost" className="w-full text-sm text-blue-500 hover:text-blue-600">
            See All Suggestions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedUsers;
