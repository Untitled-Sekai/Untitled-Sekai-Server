import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './BanManager.css';

interface BanFormData {
  username: string;
  reason: string;
  isPermanent: boolean;
  timeoutDays: number;
}

const BanManager = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BanFormData>({
    username: '',
    reason: '',
    isPermanent: false,
    timeoutDays: 1
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 権限チェック
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
        setUserRole(userData.role);

        // 管理者かモデレーター以外はアクセス不可
        if (userData.role !== 'admin' && userData.role !== 'moderator') {
          navigate('/');
        }
      } catch (error) {
        console.error('認証エラー:', error);
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/users/${formData.username}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reason: formData.reason,
          isPermanent: formData.isPermanent,
          timeoutDays: formData.isPermanent ? 0 : formData.timeoutDays
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
        setFormData({
          username: '',
          reason: '',
          isPermanent: false,
          timeoutDays: 1
        });
      } else {
        setMessage({ type: 'error', text: data.message || 'エラーが発生' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生' });
      console.error('BANエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnban = async () => {
    if (!formData.username) {
      setMessage({ type: 'error', text: 'ユーザー名を入力してください' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/users/${formData.username}/unban`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: data.message });
      } else {
        setMessage({ type: 'error', text: data.message || 'エラーが発生' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'エラーが発生' });
      console.error('アンバンエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!userRole) {
    return <div className="ban-manager-loading">ロード中...</div>;
  }

  return (
    <div className="ban-manager-container">
      <h1>ユーザーBAN管理画面</h1>
      <p className="ban-manager-notice">※この操作は記録されます。</p>

      {message && (
        <div className={`ban-manager-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="ban-form">
        <div className="form-group">
          <label htmlFor="username">ユーザー名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="reason">理由</label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleInputChange}
            required
          />
        </div>

        <div className="form-group checkbox">
          <input
            type="checkbox"
            id="isPermanent"
            name="isPermanent"
            checked={formData.isPermanent}
            onChange={handleInputChange}
          />
          <label htmlFor="isPermanent">永久BAN</label>
        </div>

        {!formData.isPermanent && (
          <div className="form-group">
            <label htmlFor="timeoutDays">タイムアウト日数</label>
            <input
              type="number"
              id="timeoutDays"
              name="timeoutDays"
              min="1"
              max="365"
              value={formData.timeoutDays}
              onChange={handleInputChange}
              required
            />
          </div>
        )}

        <div className="form-actions">
          <button type="submit" className="ban-button" disabled={loading}>
            {loading ? 'BAN処理中...' : formData.isPermanent ? '永久BANする' : 'タイムアウトする'}
          </button>
          
          {userRole === 'admin' && (
            <button 
              type="button" 
              className="unban-button" 
              onClick={handleUnban}
              disabled={loading}
            >
              BANを解除する
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default BanManager;
