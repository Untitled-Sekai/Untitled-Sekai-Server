import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Register.css';
import { ERROR_MESSAGE, BUTTONS_TEXT } from '../../utils/message';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 言語設定
  const lang = 'ja';

  const validateForm = () => {
    if (password.length < 6) {
      setError(ERROR_MESSAGE.PASSWORD_TOO_SHORT[lang]);
      return false;
    }
    
    if (password !== confirmPassword) {
      setError(ERROR_MESSAGE.PASSWORD_MISMATCH[lang]);
      return false;
    }
    
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message?.[lang] || ERROR_MESSAGE.UNKNOW[lang]);
        return;
      }

      // 登録成功したらログインページに移動
      navigate('/login', { state: { registered: true } });
    } catch (err) {
      setError(ERROR_MESSAGE.NETWORK_ERROR[lang]);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>新規登録</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleRegister}>
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
            <small>※6文字以上入力してください。</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">パスワード（確認用）</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" disabled={loading}>
              {loading ? '処理中...' : BUTTONS_TEXT.REGISTER[lang]}
            </button>
          </div>
        </form>
        
        <div className="login-link">
          <p>
            すでにアカウント持ってる？ <a onClick={() => navigate('/login')}>ログインする</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
