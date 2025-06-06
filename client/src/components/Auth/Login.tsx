import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { ERROR_MESSAGE, BUTTONS_TEXT } from '../../utils/message';

interface LoginResponse {
  token: string;
  user: {
    username: string;
    user_number: number;
  };
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 言語設定（とりあえず日本語固定にしとくね）
  const lang = 'ja';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // ここでBANされてるかチェック！
        if (response.status === 403 && data.banned) {
          if (data.permanent) {
            // 永久BAN
            setError(`アカウントが永久BANされました。理由: ${data.reason}`);
          } else {
            // 一時BAN（タイムアウト）
            setError(`アカウントは${data.daysLeft}日間のタイムアウト中です。理由: ${data.reason}`);
          }
        } else {
          setError(data.message?.[lang] || ERROR_MESSAGE.LOGIN_FAILED[lang]);
        }
        return;
      }

      // ログイン成功処理
      const loginData = data as LoginResponse;
      localStorage.setItem('token', loginData.token);
      localStorage.setItem('username', loginData.user.username);
      localStorage.setItem('userNumber', loginData.user.user_number.toString());
      
      // ホームページにリダイレクト
      navigate('/');
      window.location.reload();   
    } catch (err) {
      setError(ERROR_MESSAGE.NETWORK_ERROR[lang]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>ログイン</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">ユーザー名</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">パスワード</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '読み込み中...' : BUTTONS_TEXT.LOGIN[lang]}
            </button>
          </div>
        </form>
        <div className="register-link">
          <p>
            アカウントを持っていない？ <a onClick={() => navigate('/register')}>新規登録する</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;