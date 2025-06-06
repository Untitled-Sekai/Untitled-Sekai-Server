import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './AnonymousManager.css';

const AnonymousManager: React.FC = () => {
    const navigate = useNavigate();
    const [anonymousAccounts, setAnonymousAccounts] = useState<Array<{ name: string, id: string }>>([]);
    const [newAccountName, setNewAccountName] = useState('');
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // 副名義一覧を取得
    useEffect(() => {
        const fetchAnonymousAccounts = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem('token');

                if (!token) {
                    navigate('/login');
                    return;
                }

                const response = await fetch('/api/anonymous', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('副名義情報の取得に失敗しました');
                }

                const data = await response.json();
                setAnonymousAccounts(data.anonymousaccount || []);
            } catch (err) {
                console.error('副名義取得エラー:', err);
                setError(err instanceof Error ? err.message : '副名義情報の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        fetchAnonymousAccounts();
    }, [navigate]);

    // 副名義を新規登録
    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newAccountName.trim()) {
            setError('名前を入力してください');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/register/anonymous', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newAccountName })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || '副名義の作成に失敗しました');
            }

            // 成功したら一覧を更新
            const updatedResponse = await fetch('/api/anonymous', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const updatedData = await updatedResponse.json();
            setAnonymousAccounts(updatedData.anonymousaccount || []);

            setSuccess('副名義を作成しました');
            setNewAccountName('');

            // 3秒後に成功メッセージを消す
            setTimeout(() => {
                setSuccess(null);
            }, 3000);

        } catch (err) {
            console.error('副名義作成エラー:', err);
            setError(err instanceof Error ? err.message : '副名義の作成に失敗しました');
        } finally {
            setCreating(false);
        }
    };

    // 副名義を削除
    // 副名義を削除
    const handleDeleteAccount = async (id: string) => {
        if (!window.confirm('この副名義を削除しますか？一度削除すると元に戻せません。')) {
            return;
        }

        try {
            const token = localStorage.getItem('token');
            // IDをURLセーフな形式にエンコード
            const encodedId = encodeURIComponent(id);
            const response = await fetch(`/api/anonymous/${encodedId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('副名義の削除に失敗しました');
            }

            // 削除成功したら一覧から該当アカウントを除去
            setAnonymousAccounts(prevAccounts =>
                prevAccounts.filter(account => account.id !== id)
            );

            setSuccess('副名義を削除しました');

            // 3秒後に成功メッセージを消す
            setTimeout(() => {
                setSuccess(null);
            }, 3000);

        } catch (err) {
            console.error('副名義削除エラー:', err);
            setError(err instanceof Error ? err.message : '副名義の削除に失敗しました');
        }
    };

    if (loading) {
        return <div className="anonymous-loading">読み込み中...</div>;
    }

    return (
        <div className="anonymous-manager-container">
            <div className="anonymous-manager-header">
                <Link to="/upload" className="back-link">← アップロード画面に戻る</Link>
                <h1>副名義管理</h1>
            </div>

            {error && (
                <div className="anonymous-error-message">
                    {error}
                </div>
            )}

            {success && (
                <div className="anonymous-success-message">
                    {success}
                </div>
            )}

            <div className="anonymous-create-form">
                <h2>新規副名義の作成</h2>
                <form onSubmit={handleCreateAccount}>
                    <div className="form-group">
                        <label htmlFor="newAccountName">副名義の表示名</label>
                        <input
                            type="text"
                            id="newAccountName"
                            value={newAccountName}
                            onChange={(e) => setNewAccountName(e.target.value)}
                            placeholder="副名義の表示名"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="create-button"
                        disabled={creating}
                    >
                        {creating ? '作成中...' : '副名義を作成'}
                    </button>
                </form>
            </div>

            <div className="anonymous-accounts-list">
                <h2>副名義一覧</h2>
                {anonymousAccounts.length === 0 ? (
                    <p className="no-accounts">副名義はまだありません</p>
                ) : (
                    <div className="accounts-table">
                        {anonymousAccounts.map((account) => (
                            <div key={account.id} className="account-item">
                                <div className="account-details">
                                    <span className="account-name">{account.name}</span>
                                    <span className="account-id">{account.id}</span>
                                </div>
                                <button
                                    className="delete-button"
                                    onClick={() => handleDeleteAccount(account.id)}
                                >
                                    削除
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnonymousManager;