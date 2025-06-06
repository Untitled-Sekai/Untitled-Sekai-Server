import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

interface SystemInfo {
  platform: string;
  cpuUsage: { user: number; system: number };
  memoryUsage: {
    total: number;
    free: number;
    process: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
    };
  };
  nodeVersion: string;
}

interface ServerStatus {
  serverTime: string;
  startTime: string;
  uptime: {
    total: number;
    formatted: string;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  maintenance: {
    enabled: boolean;
    lastUpdated: string;
    updatedBy: string;
  };
  system: SystemInfo;
}

interface UserStats {
  totalUsers: number;
  bannedUsers: number;
  timeoutUsers: number;
  activeUsers: number;
  newUsersToday: number;
}

interface ChartStats {
  totalCharts: number;
  publicCharts: number;
  privateCharts: number;
  newChartsToday: number;
}

interface StorageStats {
  totalSize: number;
  usedSize: number;
  freeSize: number;
  chartsSize: number;
  uploadsSize: number;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [chartStats, setChartStats] = useState<ChartStats | null>(null);
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await fetch('/api/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('認証エラー');

        const userData = await response.json();
        
        // 管理者以外はアクセス不可
        if (userData.role !== 'admin' && userData.role !== 'moderator') {
          navigate('/');
          return;
        }

        // データの取得
        fetchAllData(token);
      } catch (error) {
        console.error('認証エラー:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const fetchAllData = async (token: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // サーバーステータス情報を取得
      const statusRes = await fetch('/api/server/status', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setServerStatus(statusData);
      }
      
      // ユーザー統計を取得
      const userStatsRes = await fetch('/api/admin/stats/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (userStatsRes.ok) {
        const userStatsData = await userStatsRes.json();
        setUserStats(userStatsData);
      }
      
      // チャート統計を取得
      const chartStatsRes = await fetch('/api/admin/stats/charts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (chartStatsRes.ok) {
        const chartStatsData = await chartStatsRes.json();
        setChartStats(chartStatsData);
      }
      
      // ストレージ統計を取得
      const storageStatsRes = await fetch('/api/admin/stats/storage', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (storageStatsRes.ok) {
        const storageStatsData = await storageStatsRes.json();
        setStorageStats(storageStatsData);
      }
    } catch (err) {
      console.error('データ取得エラー:', err);
      setError('データの取得中にエラーが発生しました。');
    } finally {
      setLoading(false);
    }
  };

  // バイトを読みやすい形式に変換する関数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return <div className="admin-dashboard-loading">データを読み込み中...</div>;
  }

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-dashboard-title">管理者ダッシュボード</h1>
      
      {error && <div className="admin-dashboard-error">{error}</div>}
      
      <div className="admin-dashboard-grid">
        {/* クイックアクション */}
        <div className="admin-dashboard-card">
          <h2>管理機能</h2>
          <div className="admin-dashboard-actions">
            <Link to="/admin/ban" className="admin-action-btn danger">
              <span className="icon">🚫</span> ユーザーBAN管理
            </Link>
            <Link to="/admin/maintenance" className="admin-action-btn warning">
              <span className="icon">🔧</span> メンテナンスモード
            </Link>
            <Link to="/admin/users" className="admin-action-btn primary">
              <span className="icon">👥</span> ユーザー管理
            </Link>
            <Link to="/admin/charts" className="admin-action-btn secondary">
              <span className="icon">🎵</span> 譜面管理
            </Link>
          </div>
        </div>

        {/* サーバーステータス */}
        {serverStatus && (
          <div className="admin-dashboard-card">
            <h2>サーバーステータス</h2>
            <div className="admin-dashboard-stats">
              <div className="stat-item">
                <span className="stat-label">起動時間:</span>
                <span className="stat-value">{serverStatus.uptime.formatted}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">プラットフォーム:</span>
                <span className="stat-value">{serverStatus.system.platform}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Node.jsバージョン:</span>
                <span className="stat-value">{serverStatus.system.nodeVersion}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">メンテナンスモード:</span>
                <span className={`stat-value ${serverStatus.maintenance.enabled ? 'status-on' : 'status-off'}`}>
                  {serverStatus.maintenance.enabled ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* メモリ使用状況 */}
        {serverStatus && (
          <div className="admin-dashboard-card">
            <h2>メモリ使用状況</h2>
            <div className="admin-dashboard-memory">
              <div className="memory-bar">
                <div 
                  className="memory-used"
                  style={{
                    width: `${((serverStatus.system.memoryUsage.total - serverStatus.system.memoryUsage.free) / serverStatus.system.memoryUsage.total) * 100}%`
                  }}
                ></div>
              </div>
              <div className="memory-stats">
                <div className="stat-item">
                  <span className="stat-label">合計メモリ:</span>
                  <span className="stat-value">{formatBytes(serverStatus.system.memoryUsage.total)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">空きメモリ:</span>
                  <span className="stat-value">{formatBytes(serverStatus.system.memoryUsage.free)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">使用メモリ:</span>
                  <span className="stat-value">{formatBytes(serverStatus.system.memoryUsage.total - serverStatus.system.memoryUsage.free)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">プロセスメモリ:</span>
                  <span className="stat-value">{formatBytes(serverStatus.system.memoryUsage.process.rss)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* ユーザー統計 */}
        {userStats && (
          <div className="admin-dashboard-card">
            <h2>ユーザー統計</h2>
            <div className="admin-dashboard-stats">
              <div className="stat-item">
                <span className="stat-label">総ユーザー数:</span>
                <span className="stat-value highlight">{userStats.totalUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">アクティブユーザー:</span>
                <span className="stat-value">{userStats.activeUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">BANユーザー:</span>
                <span className="stat-value warning">{userStats.bannedUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">タイムアウトユーザー:</span>
                <span className="stat-value">{userStats.timeoutUsers}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">今日の新規ユーザー:</span>
                <span className="stat-value">{userStats.newUsersToday}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 譜面統計 */}
        {chartStats && (
          <div className="admin-dashboard-card">
            <h2>譜面統計</h2>
            <div className="admin-dashboard-stats">
              <div className="stat-item">
                <span className="stat-label">総譜面数:</span>
                <span className="stat-value highlight">{chartStats.totalCharts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">公開譜面:</span>
                <span className="stat-value">{chartStats.publicCharts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">非公開譜面:</span>
                <span className="stat-value">{chartStats.privateCharts}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">今日の新規譜面:</span>
                <span className="stat-value">{chartStats.newChartsToday}</span>
              </div>
            </div>
          </div>
        )}
        
        {/* ストレージ情報 */}
        {storageStats && (
          <div className="admin-dashboard-card">
            <h2>ストレージ情報</h2>
            <div className="admin-dashboard-storage">
              <div className="storage-bar">
                <div 
                  className="storage-used"
                  style={{
                    width: `${(storageStats.usedSize / storageStats.totalSize) * 100}%`
                  }}
                ></div>
              </div>
              <div className="storage-stats">
                <div className="stat-item">
                  <span className="stat-label">合計容量:</span>
                  <span className="stat-value">{formatBytes(storageStats.totalSize)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">使用中:</span>
                  <span className="stat-value">{formatBytes(storageStats.usedSize)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">空き容量:</span>
                  <span className="stat-value">{formatBytes(storageStats.freeSize)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">譜面データ:</span>
                  <span className="stat-value">{formatBytes(storageStats.chartsSize)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">アップロードデータ:</span>
                  <span className="stat-value">{formatBytes(storageStats.uploadsSize)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;