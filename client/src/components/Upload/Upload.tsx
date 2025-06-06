import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Upload.css';
import { ERROR_MESSAGE, SUCCESS_MESSAGE, INFO_MESSAGE, BUTTONS_TEXT } from '../../utils/message';

const DIFFICULTY_TAGS = [
    { value: 'Easy', label: 'Easy', color: '#77c766' },
    { value: 'Normal', label: 'Normal', color: '#4a90e2' },
    { value: 'Hard', label: 'Hard', color: '#f5a623' },
    { value: 'Expert', label: 'Expert', color: '#e74c3c' },
    { value: 'Master', label: 'Master', color: '#9b59b6' },
    { value: 'APPEND', label: 'APPEND', color: '#fcacfa' },
    { value: 'Other', label: 'Other', color: '#95a5a6' },
];

const Upload: React.FC = () => {
    const navigate = useNavigate();

    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState(30);
    const [difficultyTag, setDifficultyTag] = useState('Master');

    const [isPublic, setIsPublic] = useState(false);
    const [fileOpen, setFileOpen] = useState(false);
    const [isCollaboration, setIsCollaboration] = useState(false);
    const [collaborationHandles, setCollaborationHandles] = useState<string[]>(['']);
    const [isPrivateShare, setIsPrivateShare] = useState(false);
    const [privateShareHandles, setPrivateShareHandles] = useState<string[]>(['']);

    // ファイルのstate
    const [chartFile, setChartFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [bgmFile, setBgmFile] = useState<File | null>(null);

    // UI状態のstate
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: string, text: string } | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const [showDifficultyPopup, setShowDifficultyPopup] = useState(false);
    const [sonolusVerified, setSonolusVerified] = useState<boolean>(false);

    const [userData, setUserData] = useState<any>(null);

    const [anonymousAcounts, setanonymousAcounts] = useState<Array<{ name: string, id: string }>>([]);
    const [selectedId, setSelectedId] = useState<string>('');
    const [showAccountSelector, setShowAccountSelector] = useState(false);

    // ログインチェックとSonolus認証チェック
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            const username = localStorage.getItem('username');

            if (!token || !username) {
                // ログインしてないならログインページにリダイレクト
                navigate('/login', { state: { redirect: '/upload' } });
                return;
            }

            try {
                // ユーザー情報を取得してSonolus認証済みか確認
                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    throw new Error('ユーザー情報の取得に失敗');
                }

                const userData = await response.json();
                setUserData(userData);

                // sonolusAuthがtrueかチェック
                if (!userData.sonolusAuth) {
                    // 認証されてない場合はプロフィールページに飛ばす
                    setMessage({
                        type: 'error',
                        text: 'Sonolus認証が必要です'
                    });

                    // 3秒後にプロフィールページへリダイレクト
                    setTimeout(() => {
                        navigate('/profile');
                    }, 3000);
                    return;
                }

                if (userData.sonolusProfile && userData.sonolusProfile.handle) {
                    // ハンドル無しのユーザー名だけセットするよ！
                    setAuthor(username?.split('#')[0] || '');
                } else {
                    // プロフィールないならユーザー名だけ
                    setAuthor(username?.split('#')[0] || '');
                }

                // 認証済みならOK
                setSonolusVerified(true);

            } catch (error) {
                console.error('認証チェックエラー:', error);
                navigate('/login');
            }
        };

        checkAuth();
    }, [navigate]);

    // 副名義の取得
    useEffect(() => {
        const fetchAnonymousAccounts = async () => {
            if (!sonolusVerified) return;

            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/anonymous', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log('取得した副名義:', data);
                    setanonymousAcounts(data.anonymousaccount || []);
                }
            } catch (error) {
                console.error('副名義の取得エラー:', error);
            }
        };

        fetchAnonymousAccounts();
    }, [sonolusVerified]);

    useEffect(() => {
        setAuthor('');
    }, [selectedId]);

    let authorWithHandle = author || localStorage.getItem('username')?.split('#')[0] || '';

    if (selectedId) {
        // 副名義が選択されている場合
        authorWithHandle = `${authorWithHandle}${selectedId}`;
    } else if (userData?.sonolusProfile?.handle) {
        // メイン名義の場合
        authorWithHandle = `${authorWithHandle}#${userData.sonolusProfile.handle}`;
    }

    // カバー画像のプレビュー処理
    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setCoverFile(file);

            // プレビュー用のURLを生成
            const reader = new FileReader();
            reader.onload = () => {
                setPreviewImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    // フォーム送信処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // 必須項目チェック
        if (!title || !chartFile || !coverFile || !bgmFile) {
            setMessage({
                type: 'error',
                text: '必須項目をすべて入力してください。'
            });
            return;
        }

        setLoading(true);
        setMessage({
            type: 'info',
            text: INFO_MESSAGE.UPLOADING.ja
        });

        try {
            // FormDataの作成
            const formData = new FormData();
            formData.append('title', title);
            formData.append('artist', artist);

            let authorWithHandle = '';
            let originalHandle = null;

            if (selectedId) {
                const anonymousName = anonymousAcounts.find(acc => acc.id === selectedId)?.name || '';
                authorWithHandle = `${author || anonymousName}${selectedId}`;
                originalHandle = userData?.sonolusProfile?.handle || null;
                formData.append('anonymous', 'true');
                formData.append('anonymousHandle', selectedId);
            } else {
                const mainName = localStorage.getItem('username')?.split('#')[0] || '';
                authorWithHandle = `${author || mainName}`;

                if (userData?.sonolusProfile?.handle) {
                    authorWithHandle += `#${userData.sonolusProfile.handle}`;
                }
                formData.append('anonymous', 'false');
            }

            formData.append('author', authorWithHandle);
            if (originalHandle !== null) {
                formData.append('originalHandle', originalHandle.toString());
            }
            formData.append('description', description);
            formData.append('rating', rating.toString());
            formData.append('difficultyTag', difficultyTag);
            formData.append('chart', chartFile);
            formData.append('cover', coverFile);
            formData.append('bgm', bgmFile);

            formData.append('isPublic', isPublic.toString());
            formData.append('fileOpen', fileOpen.toString());

            formData.append('collaboration', isCollaboration.toString());
            if (isCollaboration) {
                // 数値に変換できるハンドル番号だけをフィルタリングして送信
                const validHandles = collaborationHandles
                    .filter(handle => handle.trim() !== '' && !isNaN(Number(handle.trim())))
                    .map(handle => handle.trim());

                if (validHandles.length > 0) {
                    formData.append('collaborationHandles', JSON.stringify(validHandles));
                }
            }

            formData.append('privateShare', isPrivateShare.toString());
            if (isPrivateShare) {
                // 数値に変換できるハンドル番号だけをフィルタリングして送信
                const validHandles = privateShareHandles
                    .filter(handle => handle.trim() !== '' && !isNaN(Number(handle.trim())))
                    .map(handle => handle.trim());

                if (validHandles.length > 0) {
                    formData.append('privateShareHandles', JSON.stringify(validHandles));
                }
            }

            // トークンを取得してヘッダーにセット
            const token = localStorage.getItem('token');

            // アップロードAPI呼び出し
            const response = await fetch('/api/chart/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || ERROR_MESSAGE.UPLOAD_FAILED.ja);
            }

            setMessage({
                type: 'success',
                text: SUCCESS_MESSAGE.UPLOAD_SUCCESS.ja
            });

            setTimeout(() => {
                navigate('/charts');
            }, 5000);

        } catch (error) {
            console.error('アップロードエラー:', error);
            setMessage({
                type: 'error',
                text: error instanceof Error ? error.message : ERROR_MESSAGE.UPLOAD_FAILED.ja
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="upload-container">
            <div className="upload-card">
                <h1>譜面アップロード</h1>
                {message && (
                    <div className={`message ${message.type}`}>
                        {message.text}
                    </div>
                )}

                {!sonolusVerified ? (
                    // 認証されてない場合の表示
                    <div className="sonolus-auth-required">
                        <p>譜面をアップロードするにはSonolus認証が必要です</p>
                        <p>プロフィールページに移動して認証してください</p>
                        <button
                            onClick={() => navigate('/profile')}
                            className="auth-redirect-button"
                        >
                            プロフィールページへ
                        </button>
                    </div>
                ) : (
                    // 認証済みならフォームを表示（既存のフォーム内容）
                    <form onSubmit={handleSubmit}>
                        <div className="form-section">
                            <h2>基本情報</h2>

                            <div className="form-group">
                                <label htmlFor="title">曲タイトル*</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="artist">アーティスト名</label>
                                <input
                                    type="text"
                                    id="artist"
                                    value={artist}
                                    onChange={(e) => setArtist(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="author">譜面作者名</label>
                                <div className="author-input-container">
                                    <input
                                        type="text"
                                        id="author"
                                        value={author}
                                        onChange={(e) => setAuthor(e.target.value)}
                                        placeholder={
                                            selectedId
                                                ? anonymousAcounts.find(acc => acc.id === selectedId)?.name || ''
                                                : localStorage.getItem('username')?.split('#')[0] || ''
                                        }
                                        disabled={loading}
                                    />
                                    {userData?.sonolusProfile?.handle && (
                                        <div
                                            className="sonolus-handle"
                                            onClick={() => setShowAccountSelector(!showAccountSelector)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <span className="sonolus-id">
                                                {selectedId ? selectedId : `#${userData.sonolusProfile.handle}`}
                                                <span className="dropdown-arrow">▼</span>
                                            </span>
                                            {showAccountSelector && (
                                                <>
                                                    <div className="account-popup-backdrop" onClick={() => setShowAccountSelector(false)}></div>
                                                    <div className="account-selector-popup">
                                                        <div
                                                            className="account-option"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setSelectedId('');
                                                                setAuthor('');
                                                                setShowAccountSelector(false);
                                                            }}
                                                        >
                                                            メインアカウント <span className="account-id-badge">#{userData.sonolusProfile.handle}</span>
                                                        </div>
                                                        {anonymousAcounts.map((acc) => (
                                                            <div
                                                                key={acc.id}
                                                                className="account-option"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedId(acc.id);
                                                                    setAuthor('');
                                                                    setShowAccountSelector(false);
                                                                }}
                                                            >
                                                                {acc.name} <span className="account-id-badge">{acc.id}</span>
                                                            </div>
                                                        ))}
                                                        <div className="account-option manage-option" onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate('/anonymous-manager');
                                                            setShowAccountSelector(false);
                                                        }}>
                                                            副名義を管理する
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <small>※未入力の場合はアカウント名が使用されます。</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">説明</label>
                                <textarea
                                    id="description"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading}
                                    rows={4}
                                />
                            </div>
                            <div className="rating-difficulty-container">
                                <div className="form-group">
                                    <label htmlFor="rating">難易度値 (1-99)</label>
                                    <div className="rating-input">
                                        <input
                                            type="range"
                                            id="rating"
                                            min="1"
                                            max="40"
                                            value={rating}
                                            onChange={(e) => setRating(parseInt(e.target.value))}
                                            disabled={loading}
                                        />
                                        <div className="rating-number-input">
                                            <input
                                                type="number"
                                                min="1"
                                                max="99"
                                                value={rating}
                                                onChange={(e) => {
                                                    // 入力値が空の場合は何もしない
                                                    if (e.target.value === '') return;

                                                    // 数値に変換
                                                    let value = parseInt(e.target.value);

                                                    // 1～99の範囲に収める
                                                    value = Math.min(99, Math.max(1, value));

                                                    setRating(value);
                                                }}
                                                disabled={loading}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="difficultyTag">難易度タグ</label>
                                    <div className="difficulty-selector">
                                        <button
                                            type="button"
                                            className="difficulty-button"
                                            onClick={() => setShowDifficultyPopup(true)}
                                            disabled={loading}
                                        >
                                            <div className="selected-difficulty">
                                                <span
                                                    className="difficulty-tag"
                                                    style={{ backgroundColor: DIFFICULTY_TAGS.find(tag => tag.value === difficultyTag)?.color }}
                                                >
                                                    {DIFFICULTY_TAGS.find(tag => tag.value === difficultyTag)?.label}
                                                </span>
                                                <span>▼ クリックして選択</span>
                                            </div>
                                        </button>

                                        {showDifficultyPopup && (
                                            <>
                                                <div className="popup-backdrop" onClick={() => setShowDifficultyPopup(false)}></div>
                                                <div className="difficulty-popup">
                                                    <div className="difficulty-options">
                                                        {DIFFICULTY_TAGS.map(tag => (
                                                            <div
                                                                key={tag.value}
                                                                className={`difficulty-option ${difficultyTag === tag.value ? 'selected' : ''}`}
                                                                onClick={() => {
                                                                    setDifficultyTag(tag.value);
                                                                    setShowDifficultyPopup(false);
                                                                }}
                                                            >
                                                                <span
                                                                    className="difficulty-tag"
                                                                    style={{ backgroundColor: tag.color }}
                                                                >
                                                                    {tag.label}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="form-group settings-options">
                            <div className="setting-toggle">
                                <label htmlFor="isPublic" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                        disabled={true}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>公開する</span>
                                </label>
                                <small>※初期投稿は強制的に非公開になります。</small>
                            </div>

                            <div className="setting-toggle">
                                <label htmlFor="fileOpen" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="fileOpen"
                                        checked={fileOpen}
                                        onChange={(e) => setFileOpen(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>譜面ファイルを公開</span>
                                </label>
                                <small>※オンにすると他のユーザーが譜面ファイルをダウンロードできるようになります</small>
                            </div>

                            <div className="setting-toggle">
                                <label htmlFor="isCollaboration" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="isCollaboration"
                                        checked={isCollaboration}
                                        onChange={(e) => setIsCollaboration(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>合作として作成</span>
                                </label>
                                <small>※他のユーザーと共同制作した譜面の場合はオンにしてください</small>
                            </div>

                            {isCollaboration && (
                                <div className="collaboration-settings">
                                    <h4>合作メンバーのハンドル番号</h4>
                                    <small>※Sonolusのハンドル番号を入力してください。追加したメンバーにも譜面が表示されます</small>

                                    {collaborationHandles.map((handle, index) => (
                                        <div key={index} className="collaboration-handle-input">
                                            <input
                                                type="text"
                                                value={handle}
                                                onChange={(e) => {
                                                    const newHandles = [...collaborationHandles];
                                                    newHandles[index] = e.target.value;
                                                    setCollaborationHandles(newHandles);
                                                }}
                                                placeholder="Sonolusハンドル番号"
                                                disabled={loading}
                                            />

                                            {/* 削除ボタン（最低1つは残す） */}
                                            {collaborationHandles.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-handle"
                                                    onClick={() => {
                                                        const newHandles = collaborationHandles.filter((_, i) => i !== index);
                                                        setCollaborationHandles(newHandles);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    {/* メンバー追加ボタン */}
                                    <button
                                        type="button"
                                        className="add-handle"
                                        onClick={() => setCollaborationHandles([...collaborationHandles, ''])}
                                        disabled={loading}
                                    >
                                        メンバーを追加
                                    </button>
                                </div>
                            )}

                            <div className="setting-toggle">
                                <label htmlFor='isPrivateShare' className='toggle-label'>
                                    <input
                                        type="checkbox"
                                        id="isPrivateShare"
                                        checked={isPrivateShare}
                                        onChange={(e) => setIsPrivateShare(e.target.checked)}
                                        disabled={loading}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>非公開共有</span>
                                </label>
                                <small>※選択したユーザーのみ譜面を閲覧できます（公開状態に関わらず）</small>
                            </div>

                            {isPrivateShare && (
                                <div className="private-share-settings">
                                    <h4>共有するユーザーのハンドル番号</h4>
                                    <small>※Sonolusのハンドル番号を入力してください</small>

                                    {privateShareHandles.map((handle, index) => (
                                        <div key={index} className="private-share-handle-input">
                                            <input
                                                type="text"
                                                value={handle}
                                                onChange={(e) => {
                                                    const newHandles = [...privateShareHandles];
                                                    newHandles[index] = e.target.value;
                                                    setPrivateShareHandles(newHandles);
                                                }}
                                                placeholder="Sonolusハンドル番号"
                                                disabled={loading}
                                            />

                                            {privateShareHandles.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="remove-handle"
                                                    onClick={() => {
                                                        const newHandles = privateShareHandles.filter((_, i) => i !== index);
                                                        setPrivateShareHandles(newHandles);
                                                    }}
                                                    disabled={loading}
                                                >
                                                    削除
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        className="add-handle"
                                        onClick={() => setPrivateShareHandles([...privateShareHandles, ''])}
                                        disabled={loading}
                                    >
                                        ユーザーを追加
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="form-section">
                            <h2>ファイル</h2>

                            <div className="file-upload-area">
                                <div className="form-group">
                                    <label htmlFor="chart">譜面ファイル (.sus/.usc)*</label>
                                    <input
                                        type="file"
                                        id="chart"
                                        accept=".sus,.usc"
                                        onChange={(e) => e.target.files && setChartFile(e.target.files[0])}
                                        disabled={loading}
                                        required
                                    />
                                    <small>{chartFile ? `選択されたファイル: ${chartFile.name}` : '※.sus/.uscファイルを推奨'}</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="cover">カバー画像*</label>
                                    <div className="cover-input-container">
                                        {previewImage && (
                                            <div className="cover-preview">
                                                <img src={previewImage} alt="Cover preview" />
                                            </div>
                                        )}
                                        <input
                                            type="file"
                                            id="cover"
                                            accept="image/*"
                                            onChange={handleCoverChange}
                                            disabled={loading}
                                            required
                                        />
                                    </div>
                                    <small>{coverFile ? `選択されたファイル: ${coverFile.name}` : '※JPG/PNGを推奨'}</small>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="bgm">音楽ファイル (.mp3/.ogg/.wav)*</label>
                                    <input
                                        type="file"
                                        id="bgm"
                                        accept=".mp3,.ogg,.wav"
                                        onChange={(e) => e.target.files && setBgmFile(e.target.files[0])}
                                        disabled={loading}
                                        required
                                    />
                                    <small>{bgmFile ? `選択されたファイル: ${bgmFile.name}` : '※mp3,wavを推奨'}</small>
                                </div>
                            </div>
                        </div>

                        <div className="form-actions">
                            <button type="submit" disabled={loading} className="upload-button">
                                {loading ? INFO_MESSAGE.UPLOADING.ja : BUTTONS_TEXT.UPLOAD.ja}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default Upload;