import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Bell, 
  X, 
  Trash2, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  DollarSign, 
  PackageOpen 
} from 'lucide-react';
import { useDatabase } from '../context/DatabaseContext';

export const NotificationCenter: React.FC = () => {
  const { notifications, markNotificationRead, clearAllNotifications } = useDatabase();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <PackageOpen className="w-4 h-4 text-rose-500" />;
      case 'high_expense':
        return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case 'negative_diff':
        return <DollarSign className="w-4 h-4 text-red-500" />;
      case 'target_achieved':
        return <TrendingUp className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getNotifColor = (type: string, read: boolean) => {
    if (read) return 'bg-gray-50/50 border-gray-100';
    switch (type) {
      case 'low_stock':
        return 'bg-rose-500/5 border-rose-100/60';
      case 'high_expense':
        return 'bg-amber-500/5 border-amber-100/60';
      case 'negative_diff':
        return 'bg-red-500/5 border-red-100/60';
      case 'target_achieved':
        return 'bg-emerald-500/5 border-emerald-100/60';
      default:
        return 'bg-orange-500/5 border-orange-100/60';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Bell */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-xl bg-white hover:bg-orange-50/30 border border-orange-100/60 flex items-center justify-center relative cursor-pointer shadow-xs transition-all active:scale-95"
      >
        <Bell className={`w-5 h-5 text-gray-700 ${unreadCount > 0 ? 'animate-bounce' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-brand-orange text-white text-[9px] font-mono font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-3 w-96 rounded-2xl glass-panel border border-orange-100 shadow-xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-orange-100/60 flex items-center justify-between bg-orange-50/25">
              <div>
                <h3 className="font-display font-bold text-sm text-gray-950">
                  Notification Center
                </h3>
                <span className="text-[10px] text-gray-500 font-mono">
                  {unreadCount} unread system logs
                </span>
              </div>
              
              {notifications.length > 0 && (
                <button 
                  onClick={clearAllNotifications}
                  className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-gray-400 rounded-lg transition-all text-xs flex items-center gap-1 cursor-pointer font-medium"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear All
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-96 overflow-y-auto divide-y divide-orange-100/30">
              {notifications.length === 0 ? (
                <div className="px-5 py-8 text-center flex flex-col items-center justify-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <p className="text-xs text-gray-500 font-medium">All caught up!</p>
                  <span className="text-[10px] text-gray-400">No active alerts at this time.</span>
                </div>
              ) : (
                notifications.map((notif) => (
                  <div 
                    key={notif.id}
                    onClick={() => !notif.read && markNotificationRead(notif.id)}
                    className={`p-4 transition-all hover:bg-orange-50/10 cursor-pointer border-l-3 ${notif.read ? 'border-transparent' : 'border-brand-orange'} ${getNotifColor(notif.type, notif.read)}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 p-1 bg-white border border-orange-100/40 rounded-lg shadow-2xs">
                        {getNotifIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-semibold ${notif.read ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.title}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400 shrink-0">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed mb-2">
                          {notif.message}
                        </p>
                        
                        {!notif.read && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              markNotificationRead(notif.id);
                            }}
                            className="text-[10px] font-semibold text-brand-orange hover:text-brand-red transition-colors"
                          >
                            Mark as Read
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
