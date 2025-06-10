import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import './ChartDetail.css';
import { ChartDetail as ChartDetailType } from '../../../../src/models/level'
import CollaborationMember from './CollaborationMember';

const ChartDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [chart, setChart] = useState<ChartDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [hasEditPermission, setHasEditPermission] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = localStorage.getItem('token');

                if (!token) {
                    console.log('ログインされていません。');
                    return;
                }

                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setCurrentUser(userData);
                } else {
                    if (response.status === 401) {
                        console.log('トークンが無効な可能性があります。ログアウトします。');
                        localStorage.removeItem('token');
                    }
                }
            } catch (err) {
                console.error('ユーザー情報の取得に失敗:', err);
            }
        };

        fetchCurrentUser();
    }, []);

    useEffect(() => {
        const fetchChartDetail = async () => {
            try {
                setLoading(true);

                const response = await fetch(`/api/charts/${id}`);

                if (!response.ok) {
                    throw new Error('データの取得に失敗しました。');
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '譜面データの取得に失敗しました。');
                }

                setChart(result.data);
                setLoading(false);
            } catch (err) {
                console.error('譜面詳細の取得エラー:', err);
                setError('譜面データの取得に失敗しました。');
                setLoading(false);
            }
        };

        fetchChartDetail();

        return () => {
            if (audioRef.current) {
                audioRef.current.pause();
            }
        };
    }, [id]);

    // 編集権限
    useEffect(() => {
        if (chart && currentUser) {
            const isAdmin = currentUser.role === 'admin';
            const isModerator = currentUser.role === 'moderator';

            const authorHandle = (chart.author.ja || chart.author.en).split('#')[1] || "";
            let isAuthor = authorHandle !== "" &&
                (currentUser.sonolusProfile?.handle === parseInt(authorHandle) ||
                    currentUser.sonolusProfile?.handle === authorHandle);

            if (!isAuthor && chart.meta?.anonymous?.isAnonymous && chart.meta.anonymous.original_handle) {
                const originalHandle = chart.meta.anonymous.original_handle;
                isAuthor = currentUser.sonolusProfile?.handle === originalHandle ||
                    currentUser.sonolusProfile?.handle === parseInt(String(originalHandle));
            }

            if (!isAuthor && chart.meta?.anonymous?.isAnonymous && chart.meta.anonymous.original_handle) {
                const originalHandle = chart.meta.anonymous.original_handle;
                isAuthor = currentUser.sonolusProfile?.handle === originalHandle ||
                    currentUser.sonolusProfile?.handle === parseInt(String(originalHandle))
            }

            let isAltAccount = false;
            if (!isAuthor && currentUser.anonymousaccount && currentUser.anonymousaccount.length > 0 && authorHandle) {
                interface AnonymousAccount {
                    id: string;
                }
                isAltAccount = currentUser.anonymousaccount.some((account: AnonymousAccount) => {
                    const altId = account.id.replace('#', '');
                    return altId === authorHandle;
                });
            }
            setHasEditPermission(isAdmin || isAuthor || isModerator || isAltAccount);
        }
    }, [chart, currentUser]);

    if (loading) {
        return <div className="chart-detail-loading">読み込み中</div>;
    }

    if (error || !chart) {
        return (
            <div className="chart-detail-error">
                <h2>譜面が見つかりません</h2>
                <p>{error || '譜面がみつかりません'}</p>
                <Link to="/charts" className="back-button">譜面一覧に戻る</Link>
            </div>
        );
    }

    const title = chart.title.ja || chart.title.en;
    const artist = chart.artist.ja || chart.artist.en;
    const author = chart.author.ja || chart.author.en;
    const description = chart.description.ja || chart.description.en || `説明なし`;
    const coverUrl = chart.coverUrl.startsWith('https') ? chart.coverUrl : `${window.location.origin}${chart.coverUrl} + png`;

    return (
        <div className="chart-detail-container">

            <Helmet>
                <title>{`${title} (${artist}) - 難易度${chart.rating} | Reuntitled Sekai`}</title>
                <meta name="description" content={description} />

                <meta property="og:title" content={`${title} - 難易度${chart.rating}`} />
                <meta property="og:description" content={description} />
                <meta property="og:image" content={coverUrl} />
                <meta property="og:type" content="music.song" />
                <meta property="og:url" content={window.location.href} />

                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`${title} (${artist}) - 難易度${chart.rating}`} />
                <meta name="twitter:description" content={description} />
                <meta name="twitter:image" content={coverUrl} />

                <script type="application/ld+json">
                    {JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "MusicComposition",
                        "name": title,
                        "composer": {
                            "@type": "Person",
                            "name": artist
                        },
                        "genre": "Game Music",
                        "producer": {
                            "@type": "Person",
                            "name": author
                        },
                        "image": coverUrl,
                        "difficulty": chart.rating
                    })}
                </script>
            </Helmet>

            <Link to="/charts" className="back-link">← 譜面一覧に戻る</Link>

            <div className="chart-detail-header">
                <div className="chart-cover-large">
                    <img src={chart.coverUrl} alt={`${chart.title.ja || chart.title.en}のジャケット`} />
                </div>

                <div className="chart-info-main">
                    <h1>{chart.title.ja || chart.title.en}</h1>
                    <div className="chart-artist-row">
                        <span className="label">アーティスト:</span>
                        <span className="value">{chart.artist.ja || chart.artist.en}</span>
                    </div>

                    <div className="chart-meta-row">
                        <div className="chart-meta-item author-section">
                            <span className="label">譜面作者:</span>
                            <div className="value author-container">
                                {chart.meta?.anonymous?.isAnonymous ? (
                                    currentUser?.role === 'admin' || currentUser?.role === 'moderator' ||
                                        (currentUser?.sonolusProfile?.handle === chart.meta.anonymous.original_handle) ? (
                                        // 管理者、モデレーター、または投稿者本人の場合、匿名と元の投稿者情報の両方を表示
                                        <div className="anonymous-author-container">
                                            <span className="anonymous-badge">匿名投稿</span>
                                            <span className="main-author anonymous-author">
                                                {chart.author.ja || chart.author.en}
                                            </span>
                                            <span className="original-author-note">
                                                (元投稿者: {String(chart.meta.anonymous.original_handle)})
                                            </span>
                                        </div>
                                    ) : (
                                        // 一般ユーザーには匿名表示のみ
                                        <span className="main-author anonymous-author">
                                            {chart.author.ja || chart.author.en}
                                        </span>
                                    )
                                ) : (
                                    // 通常の投稿の場合
                                    <Link
                                        to={`/profile/${encodeURIComponent((chart.author.ja || chart.author.en).split('#')[0])}`}
                                        className="main-author"
                                    >
                                        {chart.author.ja || chart.author.en}
                                    </Link>
                                )}

                                {chart.meta?.collaboration?.iscollaboration && chart.meta.collaboration.members && chart.meta.collaboration.members.length > 0 && (
                                    <div className="collab-members">
                                        <div className="collab-label">合作メンバー:</div>
                                        <div className="collab-list">
                                            {chart.meta.collaboration.members.map((member, index) => (
                                                <CollaborationMember key={index} handle={member.handle} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="chart-meta-item">
                            <span className="label">難易度:</span>
                            <span className="value rating">{chart.rating}</span>
                        </div>
                    </div>

                    <div className="chart-uploaded">
                        <span className="label">アップロード日:</span>
                        <span className="value">{new Date(chart.uploadDate).toLocaleDateString('ja-JP')}</span>
                    </div>

                    {chart.tags && chart.tags.length > 0 && (
                        <div className="chart-tags">
                            {chart.tags.map(tag => (
                                <span key={tag._id || Math.random().toString()} className="tag">
                                    {tag.title?.ja || tag.title?.en || 'タグ'}
                                </span>
                            ))}
                        </div>
                    )}

                    <div className="chart-actions">
                        <button
                            className="play-button large"
                            onClick={() => {
                                window.location.href = `https://open.sonolus.com/${window.location.host}/levels/${chart.name}`;
                            }}
                        >
                            Sonolusで開く
                        </button>

                        {/* 権限がある場合のみ編集・削除ボタンを表示 */}
                        {hasEditPermission && (
                            <>
                                <button className="edit-button" onClick={() => window.location.href = `/edit/${chart.name}`}>
                                    編集
                                </button>
                                <button className="delete-button" onClick={() => {
                                    if (window.confirm('本当にこの譜面を削除しますか？')) {
                                        fetch(`/api/chart/delete/${chart.name}`, {
                                            method: 'DELETE',
                                        })
                                            .then(response => {
                                                if (!response.ok) {
                                                    throw new Error('削除に失敗しました。');
                                                }
                                                return response.json();
                                            })
                                            .then(_ => {
                                                alert('譜面削除完了！');
                                                window.location.href = '/charts';
                                            })
                                            .catch(error => {
                                                console.error('削除エラー:', error);
                                                alert('削除に失敗しました。');
                                            });
                                    }
                                }}>
                                    削除
                                </button>
                            </>
                        )}

                        {chart.meta.fileOpen && chart.meta.originalUrl && (
                            <button
                                className="download-button"
                                onClick={() => window.open(chart.meta.originalUrl, '_blank')}
                            >
                                譜面ファイルDL
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="chart-description-section">
                <h2>譜面説明</h2>
                <p>{chart.description.ja || chart.description.en || '説明なし'}</p>
            </div>
        </div>
    );
};

export default ChartDetail;