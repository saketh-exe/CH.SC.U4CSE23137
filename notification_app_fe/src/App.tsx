import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { Log } from 'loggin_middleware';

// Types Based on Stage 6 specs
interface NotificationItem {
  ID: string;
  Type: string;
  Message: string;
  Timestamp: string;
  isRead: boolean;
}

const API_URL = "http://20.207.122.201/evaluation-service/notifications";
const API_TOKEN = import.meta.env.VITE_ACCESS_TOKEN;

function App() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'PRIORITY'>('ALL');
  
  // Pagination & Filter state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [notificationType, setNotificationType] = useState<string>('');

  useEffect(() => {
    // Fetch using actual API url and token from environment variables
    const fetchNotifications = async () => {
      try {
        const params: any = { 
          page: filter === 'PRIORITY' ? 1 : page, 
          limit: filter === 'PRIORITY' ? 10 : limit 
        };
        if (notificationType && filter !== 'PRIORITY') {
          params.notification_type = notificationType;
        }

        const res = await axios.get(API_URL, {
          params,
          headers: {
             'Authorization': `Bearer ${API_TOKEN}`,
             'Accept': 'application/json'
          }
        });
        
        const data = res.data;
        
        // Ensure fetched properties map correctly as isRead defaults to false
        const parsedData = Array.isArray(data.notifications) ? data.notifications.map((n: any) => ({
          ID: n.ID,
          Type: n.Type,
          Message: n.Message,
          Timestamp: n.Timestamp,
          isRead: false
        })) : [];
        
        setNotifications(parsedData);
        Log("frontend", "info", "App", `Fetched ${parsedData.length} notifications`);
      } catch (err) {
        console.error("Failed to fetch", err);
        Log("frontend", "error", "App", { message: "Failed to fetch notifications", error: err?.toString() });
      }
    };
    fetchNotifications();
  }, [page, limit, notificationType, filter]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = (id: string) => {
    Log("frontend", "info", "App", `Marked notification ${id} as read`);
    setNotifications(prev => 
      prev.map(n => n.ID === id ? { ...n, isRead: true } : n)
    );
  };

  const handleMarkAllAsRead = () => {
    Log("frontend", "info", "App", "Marked all notifications as read");
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Priority Inbox Logic (Stage 6) 
  // Weights: Placement = 3, Result = 2, Event = 1
  const getPriorityScore = (type: string) => {
    switch (type.toLowerCase()) {
      case 'placement': return 3;
      case 'result': return 2;
      case 'event': return 1;
      default: return 0;
    }
  };

  const getPriorityInbox = () => {
    // Top 10 by weight, then recency
    const unread = notifications.filter(n => !n.isRead);
    return unread.sort((a, b) => {
      const scoreDiff = getPriorityScore(b.Type) - getPriorityScore(a.Type);
      if (scoreDiff !== 0) return scoreDiff;
      // Secondary sort: Recency
      return new Date(b.Timestamp).getTime() - new Date(a.Timestamp).getTime();
    }).slice(0, 10);
  };

  const getDisplayedNotifications = () => {
    if (filter === 'UNREAD') return notifications.filter(n => !n.isRead);
    if (filter === 'PRIORITY') return getPriorityInbox();
    return notifications; // 'ALL'
  };

  const displayed = getDisplayedNotifications();

  return (
    <div className="container">
      <header className="header">
        <h1>Dashboard</h1>
        <div className="badge-container">
          <svg className="bell" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: 'middle', marginRight: '5px' }}>
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </div>
      </header>

      <div className="card notification-panel">
        <div className="panel-header">
          <h2>Notifications</h2>
          <button className="btn-secondary" onClick={handleMarkAllAsRead}>
            Mark all as read
          </button>
        </div>

        <div className="tabs">
          <button className={`tab ${filter === 'ALL' ? 'active' : ''}`} onClick={() => setFilter('ALL')}>All</button>
          <button className={`tab ${filter === 'UNREAD' ? 'active' : ''}`} onClick={() => setFilter('UNREAD')}>Unread</button>
          <button className={`tab ${filter === 'PRIORITY' ? 'active' : ''}`} onClick={() => setFilter('PRIORITY')}>Priority Inbox</button>
        </div>

        {filter !== 'PRIORITY' && (
          <div className="pagination-controls">
            <div className="pagination-filters">
              <label>Type:</label>
              <select value={notificationType} onChange={(e) => { setNotificationType(e.target.value); setPage(1); }}>
                <option value="">All Types</option>
                <option value="Event">Event</option>
                <option value="Result">Result</option>
                <option value="Placement">Placement</option>
              </select>
              
              <label>Limit:</label>
              <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                <option value={5}>5</option>
                <option value={7}>7</option>

                <option value={10}>10</option>
              </select>
            </div>
            <div className="pagination-actions">
              <button className="btn-secondary" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</button>
              <span className="page-indicator">Page {page}</span>
              <button className="btn-secondary" onClick={() => setPage(p => p + 1)} disabled={notifications.length < limit}>Next</button>
            </div>
          </div>
        )}

        <div className="list">
          {displayed.length === 0 ? (
            <p className="empty-msg">No notifications.</p>
          ) : (
            displayed.map(n => (
              <div key={n.ID} className={`notif-item ${n.isRead ? 'read' : 'unread'}`}>
                <div className="notif-content">
                  <span className={`tag ${n.Type.toLowerCase()}`}>{n.Type}</span>
                  <p className="message">{n.Message}</p>
                  <span className="time">{new Date(n.Timestamp).toLocaleString()}</span>
                </div>
                {!n.isRead && (
                  <button className="btn-primary" onClick={() => handleMarkAsRead(n.ID)}>
                    Mark Read
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
