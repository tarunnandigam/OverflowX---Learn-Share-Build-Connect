import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import API from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { getMediaUrl } from '../utils/media';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { addToast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await API.get('/users');
      setUsers(res.data);
    } catch (err) {
      addToast('Failed to load users directory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((u) =>
    u && u.username && u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#F48024]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto text-[13px] text-gray-800">
      <h1 className="text-[24px] text-gray-900 font-normal mb-4">Users</h1>

      {/* Search and Filters */}
      <div className="mb-6 flex items-center max-w-sm border border-gray-300 rounded-[3px] p-2 bg-white focus-within:border-[#0074CC] focus-within:ring-4 focus-within:ring-[#0074CC]/20 outline-none">
        <Search size={16} className="text-gray-400 mr-2" />
        <input
          type="text"
          placeholder="Filter by user..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-[13px] text-gray-800 outline-none"
        />
      </div>

      {/* Grid of Users */}
      {filteredUsers.length === 0 ? (
        <div className="text-center text-gray-500 py-10 bg-gray-50 border border-gray-200 rounded">
          No users match your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredUsers.map((u) => (
            <div key={u._id} className="flex gap-3 p-3 bg-white hover:bg-gray-50 border border-gray-200 rounded-[3px] transition-colors">
              {u.avatar ? (
                <img src={getMediaUrl(u.avatar)} alt={u.username || 'User'} className="w-12 h-12 rounded-[3px] object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-[3px] bg-indigo-600 text-white flex items-center justify-center font-bold text-lg uppercase flex-shrink-0">
                  {u.username ? u.username.charAt(0) : '?'}
                </div>
              )}
              <div className="min-w-0">
                <Link to={`/profile/${u.username || ''}`} className="text-[#0074CC] hover:text-[#0A95FF] font-medium text-sm block truncate">
                  {u.username || 'Unknown User'}
                </Link>
                <span className="text-[11px] text-gray-500 block truncate">
                  Joined {new Date(u.createdAt).toLocaleDateString()}
                </span>
                <span className="text-xs text-gray-600 block mt-1 truncate">
                  {u.bio || 'No bio provided.'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;
