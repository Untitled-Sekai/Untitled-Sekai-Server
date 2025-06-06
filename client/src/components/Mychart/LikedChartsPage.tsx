import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import MyChartList from './MyChartList';
import './UserChartsPage.css';

const LikedChartsPage: React.FC = () => {
  const { username } = useParams<{ username?: string }>();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);

  useEffect(() => {
    const checkCurrentUser = () => {
      if (!username) return;
      
      setLoading(true);
      try {
        const loggedInUsername = localStorage.getItem('username');
        setIsCurrentUser(username === loggedInUsername);
      } catch (err) {
        console.error('ユーザー情報確認エラー:', err);
        setError(err instanceof Error ? err.message : 'エラー');
      } finally {
        setLoading(false);
      }
    };

    checkCurrentUser();
  }, [username]);

  if (loading) {
    return <div className="page-loading">読み込み中</div>;
  }

  if (error || !username) {
    return (
      <div className="page-error">
        <h2>ユーザーが見つかりません</h2>
        <p>{error || 'ユーザー名が指定されていません'}</p>
        <Link to="/" className="back-button">ホームに戻る</Link>
      </div>
    );
  }

  return (
    <div className="user-charts-page">
      <div className="page-header">
        <h1>
          <Link to={`/profile/${username}`} className="user-link">
            {username}
          </Link>
          がいいねした譜面
        </h1>
        <Link to={`/profile/${username}`} className="profile-link">
          プロフィールに戻る
        </Link>
      </div>

      <div className="charts-container">
        <MyChartList 
          username={username} 
          isCurrentUser={isCurrentUser} 
          type="liked" 
        />
      </div>
    </div>
  );
};

export default LikedChartsPage;