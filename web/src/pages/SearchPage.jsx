import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Search as SearchIcon, X } from 'lucide-react';

import { searchUsers, clearSearchResults } from '../store/slices/userSlice';
import Avatar from '../components/ui/Avatar';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardContent } from '../components/ui/Card';

const SearchPage = () => {
  const dispatch = useDispatch();
  const { searchResults } = useSelector((state) => state.users);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.trim()) {
        dispatch(searchUsers(query.trim()));
      } else {
        dispatch(clearSearchResults());
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, dispatch]);

  const handleClear = () => {
    setQuery('');
    dispatch(clearSearchResults());
  };

  return (
    <div className="max-w-2xl mx-auto pt-16 lg:pt-0">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-8">
        Search
      </h1>

      {/* Search Input */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <SearchIcon className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {query && (
              <button
                onClick={handleClear}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((user) => (
                <div key={user._id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar
                        src={user.avatar}
                        alt={user.username}
                        size="md"
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {user.username}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {user.fullName || user.email}
                        </p>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      variant={user.isFollowing ? "secondary" : "primary"}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : query.trim() ? (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            No users found for "{query}"
          </p>
        </div>
      ) : (
        <div className="text-center py-8">
          <SearchIcon className="h-16 w-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            Search for people to discover new content
          </p>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
