import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import './ChartEdit.css';
import { ChartDetail as ChartDetailType } from '../../../../src/models/level';

const DIFFICULTY_TAGS = [
    { value: 'Easy', label: 'Easy', color: '#77c766' },
    { value: 'Normal', label: 'Normal', color: '#4a90e2' },
    { value: 'Hard', label: 'Hard', color: '#f5a623' },
    { value: 'Expert', label: 'Expert', color: '#e74c3c' },
    { value: 'Master', label: 'Master', color: '#9b59b6' },
    { value: 'APPEND', label: 'APPEND', color: '#fcacfa' },
    { value: 'Other', label: 'Other', color: '#95a5a6' },
];


const ChartEdit = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [chart, setChart] = useState<ChartDetailType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // 編集用のフォームステート
    const [title, setTitle] = useState('');
    const [artist, setArtist] = useState('');
    const [author, setAuthor] = useState('');
    const [description, setDescription] = useState('');
    const [rating, setRating] = useState(0);

    // ファイル関連
    const [chartFile, setChartFile] = useState<File | null>(null);
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [bgmFile, setBgmFile] = useState<File | null>(null);

    // プレビュー表示用
    const [coverPreview, setCoverPreview] = useState('');

    const fileInputRefs = {
        chart: useRef<HTMLInputElement | null>(null),
        cover: useRef<HTMLInputElement | null>(null),
        bgm: useRef<HTMLInputElement | null>(null),
    };

    const [difficultyTag, setDifficultyTag] = useState('Master');
    const [isPublic, setIsPublic] = useState(true);
    const [isDerivative, setIsDerivative] = useState(false);
    const [fileOpen, setFileOpen] = useState(false);
    const [showDifficultyPopup, setShowDifficultyPopup] = useState(false);

    // 初期データの取得
    useEffect(() => {
        const fetchChartDetail = async () => {
            try {
                setLoading(true);
                const response = await fetch(`/api/charts/${id}`);

                if (!response.ok) {
                    throw new Error('データの取得に失敗');
                }

                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '譜面データの取得に失敗');
                }

                const chartData = result.data;
                const authorStr = chartData.author.ja || chartData.author.en || '';
                setChart(chartData);

                // フォームの初期値を設定
                setTitle(chartData.title.ja || chartData.title.en || '');
                setArtist(chartData.artist.ja || chartData.artist.en || '');
                setAuthor(authorStr.split('#')[0]);
                setDescription(chartData.description.ja || chartData.description.en || '');
                setRating(chartData.rating || 0);
                setCoverPreview(chartData.coverUrl);

                setDifficultyTag(chartData.difficultyTag || 'Master');
                setIsPublic(chartData.isPublic !== false); // falseのときだけfalse
                setIsDerivative(chartData.derivative === true); // trueのときだけtrue
                setFileOpen(chartData.fileOpen === true); // trueのときだけtrue

                setLoading(false);
            } catch (err) {
                console.error('譜面詳細の取得エラー:', err);
                setError(err instanceof Error ? err.message : 'エラーが発生');
                setLoading(false);
            }
        };

        if (id) {
            fetchChartDetail();
        }
    }, [id]);

    // ファイル選択ハンドラ
    const handleFileChange = (e: ChangeEvent<HTMLInputElement>, fileType: 'chart' | 'cover' | 'bgm') => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            switch (fileType) {
                case 'chart':
                    setChartFile(file);
                    break;
                case 'cover':
                    setCoverFile(file);
                    // 画像プレビュー設定
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        if (event.target && typeof event.target.result === 'string') {
                            setCoverPreview(event.target.result);
                        }
                    };
                    reader.readAsDataURL(file);
                    break;
                case 'bgm':
                    setBgmFile(file);
                    break;
            }
        }
    };

    // 保存ボタン押下時の処理
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!chart) return;
        const originalAuthor = chart.author.ja || chart.author.en || '';
        const handleMatch = originalAuthor.match(/#(.+)$/);
        const sonolusHandle = handleMatch ? handleMatch[1] : null;

        // ユーザー入力のauthor + 抽出したハンドルを組み合わせる
        let authorWithHandle = author;
        if (sonolusHandle) {
            authorWithHandle = `${author}#${sonolusHandle}`;
        }
        try {
            setSaving(true);

            const formData = new FormData();
            formData.append('title', title);
            formData.append('artist', artist);
            formData.append('author', authorWithHandle);
            formData.append('description', description);
            formData.append('rating', String(rating));

            formData.append('difficultyTag', difficultyTag);
            formData.append('isPublic', isPublic.toString());
            formData.append('derivative', isDerivative.toString());
            formData.append('fileOpen', fileOpen.toString());

            if (chartFile) formData.append('chart', chartFile);
            if (coverFile) formData.append('cover', coverFile);
            if (bgmFile) formData.append('bgm', bgmFile);
            console.log(chart.name)
            const response = await fetch(`/api/chart/edit/${chart.name}`, {
                method: 'PATCH',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || '更新に失敗したわ');
            }

            const result = await response.json();
            alert('譜面の更新が完了');
            navigate(`/charts/${result.name}`);

        } catch (error) {
            console.error('譜面更新エラー:', error);
            alert('更新に失敗');
        } finally {
            setSaving(false);
        }
    };

    // ファイル選択ボタンのクリックハンドラ
    const triggerFileInput = (inputRef: React.RefObject<HTMLInputElement | null>) => {
        inputRef.current?.click();
    };

    if (loading) {
        return <div className="chart-edit-loading">読み込み中</div>;
    }

    if (error || !chart) {
        return (
            <div className="chart-edit-error">
                <h2>譜面がみつかりません</h2>
                <p>{error || '譜面データがありません'}</p>
                <Link to="/charts" className="back-button">譜面一覧に戻る</Link>
            </div>
        );
    }

    return (
        <div className="chart-edit-container">
            <div className="chart-edit-header">
                <Link to={`/charts/${id}`} className="back-link">← 詳細に戻る</Link>
                <h1>譜面を編集する</h1>
            </div>

            <form className="chart-edit-form" onSubmit={handleSubmit}>
                <div className="form-row">
                    <div className="form-group">
                        <div className="cover-preview">
                            <img
                                src={coverPreview}
                                alt="ジャケット"
                                className="cover-image"
                            />
                            <button
                                type="button"
                                className="change-cover-btn"
                                onClick={() => triggerFileInput(fileInputRefs.cover)}
                            >
                                画像を変更
                            </button>
                            <input
                                type="file"
                                ref={fileInputRefs.cover}
                                onChange={(e) => handleFileChange(e, 'cover')}
                                accept="image/*"
                                className="hidden-input"
                            />
                        </div>
                    </div>

                    <div className="form-group main-info">
                        <div className="input-group">
                            <label htmlFor="title">曲名</label>
                            <input
                                id="title"
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="artist">アーティスト</label>
                            <input
                                id="artist"
                                type="text"
                                value={artist}
                                onChange={(e) => setArtist(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="author">譜面作者</label>
                            <input
                                id="author"
                                type="text"
                                value={author}
                                onChange={(e) => setAuthor(e.target.value)}
                                required
                            />
                            {(() => {
                                const originalAuthor = chart.author.ja || chart.author.en || '';
                                const handleMatch = originalAuthor.match(/#(.+)$/);
                                const sonolusHandle = handleMatch ? handleMatch[1] : null;

                                return sonolusHandle ? (
                                    <div className="sonolus-handle-display">
                                        <span className="sonolus-tag">#{sonolusHandle}</span>
                                    </div>
                                ) : null;
                            })()}
                        </div>

                        <div className="input-group">
                            <label htmlFor="rating">難易度</label>
                            <input
                                id="rating"
                                type="number"
                                min="1"
                                max="50"
                                value={rating}
                                onChange={(e) => setRating(Number(e.target.value))}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="difficultyTag">難易度タグ</label>
                            <div className="difficulty-selector">
                                <button
                                    type="button"
                                    className="difficulty-button"
                                    onClick={() => setShowDifficultyPopup(true)}
                                >
                                    <div className="selected-difficulty">
                                        <span
                                            className="difficulty-tag"
                                            style={{ backgroundColor: DIFFICULTY_TAGS.find(tag => tag.value === difficultyTag)?.color }}
                                        >
                                            {DIFFICULTY_TAGS.find(tag => tag.value === difficultyTag)?.label}
                                        </span>
                                        <span>▼ 選択</span>
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
                        <div className="form-group settings-options">
                            <div className="setting-toggle">
                                <label htmlFor="isPublic" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="isPublic"
                                        checked={isPublic}
                                        onChange={(e) => setIsPublic(e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>公開する</span>
                                </label>
                                <small>※オフにすると他のユーザーには表示されません</small>
                            </div>

                            <div className="setting-toggle">
                                <label htmlFor="isDerivative" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="isDerivative"
                                        checked={isDerivative}
                                        onChange={(e) => setIsDerivative(e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>派生譜面</span>
                                </label>
                                <small>※他の譜面をベースにした派生譜面の場合はオン</small>
                            </div>

                            <div className="setting-toggle">
                                <label htmlFor="fileOpen" className="toggle-label">
                                    <input
                                        type="checkbox"
                                        id="fileOpen"
                                        checked={fileOpen}
                                        onChange={(e) => setFileOpen(e.target.checked)}
                                    />
                                    <span className="toggle-switch"></span>
                                    <span>譜面ファイルを公開</span>
                                </label>
                                <small>※オンにすると他のユーザーが譜面ファイルをダウンロードできます</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="form-group">
                    <div className="input-group">
                        <label htmlFor="description">譜面説明</label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={5}
                        />
                    </div>
                </div>

                <div className="form-group files-section">
                    <h3>ファイルの更新</h3>
                    <p className="help-text">変更したいファイルのみ選択してください</p>

                    <div className="file-inputs">
                        <div className="file-input-group">
                            <button
                                type="button"
                                onClick={() => triggerFileInput(fileInputRefs.chart)}
                                className="file-select-button"
                            >
                                譜面ファイル選択 (.sus/.usc)
                            </button>
                            <span className="file-name">{chartFile ? chartFile.name : '選択されていません'}</span>
                            <input
                                type="file"
                                ref={fileInputRefs.chart}
                                onChange={(e) => handleFileChange(e, 'chart')}
                                accept=".sus,.usc"
                                className="hidden-input"
                            />
                        </div>

                        <div className="file-input-group">
                            <button
                                type="button"
                                onClick={() => triggerFileInput(fileInputRefs.bgm)}
                                className="file-select-button"
                            >
                                BGMファイル選択
                            </button>
                            <span className="file-name">{bgmFile ? bgmFile.name : '選択されていません'}</span>
                            <input
                                type="file"
                                ref={fileInputRefs.bgm}
                                onChange={(e) => handleFileChange(e, 'bgm')}
                                accept="audio/*"
                                className="hidden-input"
                            />
                        </div>
                    </div>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        className="save-button"
                        disabled={saving}
                    >
                        {saving ? '保存中...' : '変更を保存'}
                    </button>
                    <Link to={`/charts/${id}`} className="cancel-button">
                        キャンセル
                    </Link>
                </div>
            </form>
        </div>
    );
};

export default ChartEdit;
