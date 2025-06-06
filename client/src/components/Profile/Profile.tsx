import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Profile.css';
import MyChartList from '../Mychart/MyChartList';

interface User {
    _id: string;
    username: string;
    userNumber: number;
    sonolusAuthenticated: boolean;
    sonolusProfile?: any;
    role: string;
    profile: {
        iconColor: string;
        description: string;
    };
    following: string[];
    followers: string[];
    likedCharts: string[];
    sonolusAuth: boolean;
    createdAt: string;
    updatedAt: string;
}

const Profile: React.FC = () => {
    const { username } = useParams<{ username?: string }>();
    const navigate = useNavigate();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isCurrentUser, setIsCurrentUser] = useState<boolean>(false);

    const [sonolusLoading, setSonolusLoading] = useState<boolean>(false);
    const [sonolusError, setSonolusError] = useState<string | null>(null);

    const [followStatus, setFollowStatus] = useState({
        isFollowing: false,
        isSelf: false,
        followersCount: 0,
        followingCount: 0
    });
    const [followLoading, setFollowLoading] = useState(false);

    useEffect(() => {
        const fetchUserProfile = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                const loggedInUsername = localStorage.getItem('username');

                let response;

                if (username) {
                    response = await fetch(`/api/users/${username}`);
                    setIsCurrentUser(username === loggedInUsername);
                } else {
                    if (!token) {
                        navigate('/login');
                        return;
                    }
                    response = await fetch('/api/me', {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    setIsCurrentUser(true);
                }

                if (!response.ok) {
                    throw new Error('ユーザー情報の取得に失敗');
                }

                const userData = await response.json();
                setUser(userData);
            } catch (err) {
                console.error('プロフィール取得エラー:', err);
                setError('ユーザー情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchUserProfile();
    }, [username, navigate]); // usernameが変わったら再取得

    // Sonolus認証処理
    const handleSonolusAuth = async () => {
        setSonolusLoading(true);
        setSonolusError(null);

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('認証情報が見つかりません。再ログインしてください。');
            }

            const currentHost = window.location.host;
            const sonolusAuthUrl = `https://open.sonolus.com/external-login/${currentHost}/api/sonolus/auth?token=${encodeURIComponent(token)}`;
            window.open(sonolusAuthUrl, '_blank');
        } catch (error) {
            console.error('Sonolus認証エラー:', error);
            setSonolusError('認証に失敗しました。' + (error instanceof Error ? error.message : ''));
        } finally {
            setSonolusLoading(false);
        }
    };

    // フォロー状態を取得
    useEffect(() => {
        const fetchFollowStatus = async () => {
            if (!username || !user) return;

            try {
                const token = localStorage.getItem('token');
                if (!token) return;

                const response = await fetch(`/api/follow-status/${username}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setFollowStatus(data);
                }
            } catch (error) {
                console.error('フォロー状態の取得に失敗:', error);
            }
        };

        fetchFollowStatus();
    }, [username, user]);

    // フォロー・アンフォロー処理の関数
    const handleFollowToggle = async () => {
        if (!username || followLoading) return;

        setFollowLoading(true);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                navigate('/login');
                return;
            }

            const method = followStatus.isFollowing ? 'DELETE' : 'POST';
            const response = await fetch(`/api/follow/${username}`, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                // フォロー状態を更新
                setFollowStatus(prev => ({
                    ...prev,
                    isFollowing: !prev.isFollowing,
                    followersCount: data.followersCount || prev.followersCount + (prev.isFollowing ? -1 : 1)
                }));
            }
        } catch (error) {
            console.error('フォロー操作に失敗:', error);
        } finally {
            setFollowLoading(false);
        }
    };

    if (loading) {
        return <div className="profile-loading">読み込み中</div>;
    }

    if (error || !user) {
        return (
            <div className="profile-error">
                <h2>ユーザーが見つかりません</h2>
                <p>{error || 'ユーザー情報の取得に失敗'}</p>
                <Link to="/" className="back-button">ホームに戻る</Link>
            </div>
        );
    }

    const iconInitial = user.username.charAt(0).toUpperCase();

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div
                    className="profile-avatar"
                    style={{ backgroundColor: user.profile.iconColor }}
                >
                    {iconInitial}
                </div>

                <div className="profile-info">
                    <h1 className="profile-username">
                        {user.username}
                        {/* ここにソノラス認証マークを追加 */}
                        {user.sonolusAuth && (
                            <span className="sonolus-badge" title="Sonolus認証済み">✓</span>
                        )}
                    </h1>
                    <p className="profile-userid">#{user.userNumber}</p>

                    {/* Sonolusプロフィール情報を表示（認証済みなら） */}
                    {user.sonolusAuth && user.sonolusProfile && (
                        <div className="sonolus-user-info">
                            <p>Sonolus: {user.sonolusProfile.name} #{user.sonolusProfile.handle}</p>
                        </div>
                    )}

                    <div className="profile-stats">
                        <div className="follower-count stat-item">
                            <span className="count-number">{followStatus.followersCount}</span>
                            <span className="count-label">フォロワー</span>
                        </div>
                        <div className="following-count stat-item">
                            <span className="count-number">{followStatus.followingCount}</span>
                            <span className="count-label">フォロー中</span>
                        </div>
                    </div>

                    {!followStatus.isSelf && !isCurrentUser && (
                        <button
                            onClick={handleFollowToggle}
                            disabled={followLoading}
                            className={`follow-button ${followStatus.isFollowing ? 'following' : ''}`}
                        >
                            {followLoading ? '処理中...' : followStatus.isFollowing ? 'フォロー中' : 'フォローする'}
                        </button>
                    )}
                </div>

                {isCurrentUser && (
                    <div className="profile-actions">
                        <Link to="/settings" className="edit-profile-button">
                            プロフィール編集
                        </Link>

                        {!user.sonolusAuth ? (
                            <button
                                onClick={handleSonolusAuth}
                                className="sonolus-auth-button"
                                disabled={sonolusLoading}
                            >
                                {sonolusLoading ? 'Sonolus認証中...' : 'Sonolusで認証する'}
                            </button>
                        ) : (
                            <div className="sonolus-verified">
                                <span className="verified-badge">✓</span>
                                認証済み
                            </div>
                        )}

                        {sonolusError && (
                            <div className="sonolus-error">
                                {sonolusError}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="profile-description">
                <h2>自己紹介</h2>
                <p>{user.profile.description || '自己紹介文がありません'}</p>
            </div>

            <div className="profile-uploads">
                <h2>投稿した譜面</h2>
                <Link to={`/users/${user.username}/charts`} className="view-all-link">
                    すべて見る →
                </Link>
                <div className="horizontal-charts-container">
                    <MyChartList
                        key={`${user.username}-${Date.now()}`}
                        username={user.username}
                        isCurrentUser={isCurrentUser}
                        type='uploaded'
                        limit={5}
                        layout="horizontal"
                    />
                </div>
            </div>

            <div className="profile-likes">
                <h2>いいねした譜面</h2>
                <Link to={`/users/${user.username}/liked`} className="view-all-link">
                    すべて見る →
                </Link>
                <div className="horizontal-charts-container">
                    <MyChartList
                        username={user.username}
                        isCurrentUser={isCurrentUser}
                        type="liked"
                        limit={5}
                        layout="horizontal"
                    />
                </div>
            </div>
        </div>
    );
};

export default Profile;