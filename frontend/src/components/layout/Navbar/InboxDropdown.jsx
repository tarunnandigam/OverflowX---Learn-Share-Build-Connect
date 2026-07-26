import React, { useState, useEffect } from 'react';
import { Mail, Check, Bell, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import API from '../../../services/api';

const InboxDropdown = ({ onClose }) => {
  const { user } = useSelector((state) => state.auth);
  const [dbNotifications, setDbNotifications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      const response = await API.get('/users/notifications');
      const list = response.data.filter((item) => !item.isAchievement);
      setDbNotifications(list);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const timeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  useEffect(() => {
    if (!user) return;
    
    const systemList = [];
    
    // 1. Verification warning
    if (!user.isEmailVerified || !user.isPhoneVerified) {
      const items = [];
      if (!user.isEmailVerified) items.push('email');
      if (!user.isPhoneVerified) items.push('phone');
      systemList.push({
        id: 'verify',
        type: 'system',
        title: 'Complete profile verification',
        body: `Please verify your ${items.join(' and ')} in settings to secure your account.`,
        time: 'Just now',
        read: false,
        isDb: false
      });
    }

    // 2. Subscription status
    const plan = user.subscription?.plan || 'Free';
    if (plan === 'Free') {
      systemList.push({
        id: 'sub',
        type: 'system',
        title: 'Upgrade your subscription',
        body: 'You are on the Free plan. Upgrade to Bronze, Silver or Gold for higher daily question limits.',
        time: '1 hour ago',
        read: false,
        isDb: false
      });
    } else {
      systemList.push({
        id: 'sub',
        type: 'system',
        title: `Active ${plan} Plan`,
        body: `Thank you for supporting OverflowX! Your ${plan} plan is fully active.`,
        time: 'Active',
        read: true,
        isDb: false
      });
    }

    // 3. Reputation milestone
    const rep = user.reputation || 1;
    systemList.push({
      id: 'rep',
      type: 'badge',
      title: `Reputation Score: ${rep}`,
      body: `You have accumulated ${rep} reputation points. Keep participating to unlock more benefits!`,
      time: 'Live',
      read: true,
      isDb: false
    });

    // Map DB notifications
    const dbMapped = dbNotifications.map(item => ({
      id: item._id,
      type: item.type,
      title: item.type === 'comment' ? 'New Answer' : 'System Notification',
      body: item.reason,
      time: timeAgo(item.createdAt),
      read: item.read,
      isDb: true
    }));

    setNotifications([...systemList, ...dbMapped]);
  }, [user, dbNotifications]);

  const markAllRead = async () => {
    try {
      await API.put('/users/notifications/read');
      fetchNotifications();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  const toggleRead = async (item) => {
    if (item.isDb) {
      try {
        const response = await API.put(`/users/notifications/${item.id}/read`);
        setDbNotifications(prev => prev.map(n => n._id === item.id ? response.data : n));
      } catch (err) {
        console.error('Failed to toggle read status:', err);
      }
    } else {
      setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, read: !n.read } : n));
    }
  };

  return (
    <div className="absolute right-0 top-[50px] w-[360px] bg-white border border-[#e3e6e8] rounded shadow-xl z-50 text-[13px] text-gray-800 overflow-hidden transform origin-top-right transition-all font-sans">
      
      {/* Header */}
      <div className="bg-[#f8f9f9] px-4 py-2.5 border-b border-[#e3e6e8] flex justify-between items-center">
        <span className="font-bold text-[#232629] flex items-center gap-1.5 text-xs">
          <Bell size={13} className="text-[#525960]" /> Inbox
        </span>
        <button 
          onClick={markAllRead} 
          className="text-[11px] text-[#0074cc] hover:text-[#0a95ff] font-medium flex items-center gap-1 cursor-pointer transition-colors"
        >
          <Check size={11} /> Mark all as read
        </button>
      </div>

      {/* List */}
      <div className="divide-y divide-[#e3e6e8] max-h-[320px] overflow-y-auto">
        {loading ? (
          <div className="p-8 flex justify-center items-center text-gray-500 gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Loading notifications...</span>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-gray-500">
            No notifications yet
          </div>
        ) : (
          notifications.map((item) => (
            <div 
              key={item.id} 
              onClick={() => toggleRead(item)}
              className={`p-3 hover:bg-[#f8f9f9] transition-colors duration-150 cursor-pointer flex gap-3 relative ${
                !item.read ? 'bg-[#f4f8fb]' : ''
              }`}
            >
              {/* Unread indicator */}
              {!item.read && (
                <span className="absolute left-2 top-4 w-1.5 h-1.5 bg-[#0a95ff] rounded-full" />
              )}

              <div className="flex-1 pl-2">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-bold text-[#0c0d0e] text-xs leading-snug">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-[#6a737c] whitespace-nowrap flex-shrink-0">
                    {item.time}
                  </span>
                </div>
                <p className="text-[11px] text-[#525960] mt-0.5 leading-normal line-clamp-2">
                  {item.body}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-[#e3e6e8] bg-[#f8f9f9] text-center p-2">
        <button 
          onClick={onClose}
          className="text-[11px] font-semibold text-[#525960] hover:text-[#232629] transition-colors py-1 cursor-pointer w-full block"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InboxDropdown;
