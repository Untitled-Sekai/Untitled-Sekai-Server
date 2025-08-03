import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './DanniList.css';

interface DanniChart {
    id: string;
    name: string;
    title: { ja: string; en: string };
    artist: { ja: string; en: string };
    rating: number;
    difficultyTag: string;
    coverUrl: string;
    hidden: boolean; // 隠し譜面かどうか
}

interface Danni {
    id: string;
    title: string;
    description: string;
    difficulty: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'Master';
    tags: string[]; // MAS, APD等のタグ
    author: string;
    createdAt: string;
    isPublic: boolean;
    passCount: number; // 合格者数
    charts: DanniChart[];
    passCondition: {
        type: 'PASS' | 'FC' | 'AP' | 'CUSTOM';
        customCondition?: string;
        isOverall: boolean; // 段位全体での条件かどうか
    };
    allowPractice: boolean; // 練習リンクを表示するか
    continuousPlay: boolean; // 連続プレイ必須かどうか
    isCleared?: boolean; // ユーザーがクリア済みかどうか
}

type SortType = 'newest' | 'oldest' | 'difficulty' | 'passCount';

const DanniList: React.FC = () => {
    const [dannis, setDannis] = useState<Danni[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [sortBy, setSortBy] = useState<SortType>('newest');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const difficultyOptions = [
        { value: 'all', label: 'すべて' },
        { value: 'Beginner', label: '初段' },
        { value: 'Intermediate', label: '中段' },
        { value: 'Advanced', label: '上段' },
        { value: 'Expert', label: '特段' },
        { value: 'Master', label: '皆伝' }
    ];

    useEffect(() => {
        fetchDannis();
    }, []);

    const fetchDannis = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/danni/list');
            
            if (!response.ok) {
                throw new Error('段位データの取得に失敗しました');
            }

            const result = await response.json();
            setDannis(result.data || []);
        } catch (error) {
            console.error('段位取得エラー:', error);
            setError(error instanceof Error ? error.message : '不明なエラーが発生しました');
        } finally {
            setLoading(false);
        }
    };

    const sortedAndFilteredDannis = () => {
        let filtered = dannis.filter(danni => {
            // 検索フィルター
            const matchesSearch = !searchQuery || 
                danni.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                danni.author.toLowerCase().includes(searchQuery.toLowerCase());

            // 難易度フィルター
            const matchesDifficulty = difficultyFilter === 'all' || danni.difficulty === difficultyFilter;

            return matchesSearch && matchesDifficulty;
        });

        // ソート
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case 'oldest':
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case 'difficulty':
                    const difficultyOrder = ['Beginner', 'Intermediate', 'Advanced', 'Expert', 'Master'];
                    return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
                case 'passCount':
                    return b.passCount - a.passCount;
                default:
                    return 0;
            }
        });

        return filtered;
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'Beginner': return '#4CAF50';
            case 'Intermediate': return '#FF9800';
            case 'Advanced': return '#F44336';
            case 'Expert': return '#9C27B0';
            case 'Master': return '#000000';
            default: return '#666';
        }
    };

    const getPassConditionText = (condition: Danni['passCondition']) => {
        switch (condition.type) {
            case 'PASS': return 'クリア';
            case 'FC': return 'フルコンボ';
            case 'AP': return 'オールパーフェクト';
            case 'CUSTOM': return condition.customCondition || 'カスタム条件';
            default: return '条件不明';
        }
    };

    if (loading) {
        return <div className="danni-list-loading">段位データを読み込み中...</div>;
    }

    if (error) {
        return <div className="danni-list-error">エラー: {error}</div>;
    }

    const filteredDannis = sortedAndFilteredDannis();

    return (
        <div className="danni-list-container">
            <div className="danni-list-header">
                <h1 className="danni-list-title">段位道場</h1>
                <p className="danni-list-description">
                    連続譜面による段位認定システム。自分の実力を試してみましょう！
                </p>
            </div>

            {/* 検索・フィルター・ソート */}
            <div className="danni-controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="段位名や制作者で検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-input"
                    />
                </div>

                <div className="filter-controls">
                    <select
                        value={difficultyFilter}
                        onChange={(e) => setDifficultyFilter(e.target.value)}
                        className="difficulty-filter"
                    >
                        {difficultyOptions.map(option => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortType)}
                        className="sort-select"
                    >
                        <option value="newest">新着順</option>
                        <option value="oldest">古い順</option>
                        <option value="difficulty">難易度順</option>
                        <option value="passCount">合格者数順</option>
                    </select>
                </div>
            </div>

            <div className="danni-results-info">
                {filteredDannis.length} 件の段位が見つかりました
            </div>

            {/* 段位一覧 */}
            {filteredDannis.length === 0 ? (
                <div className="no-dannis">
                    検索条件に一致する段位がありません
                </div>
            ) : (
                <div className="danni-grid">
                    {filteredDannis.map(danni => (
                        <div key={danni.id} className="danni-card">
                            <Link to={`/danni/${danni.id}`} className="danni-link">
                                <div className="danni-header">
                                    <h3 className="danni-title">{danni.title}</h3>
                                    <div 
                                        className="danni-difficulty"
                                        style={{ backgroundColor: getDifficultyColor(danni.difficulty) }}
                                    >
                                        {difficultyOptions.find(opt => opt.value === danni.difficulty)?.label}
                                    </div>
                                </div>

                                <div className="danni-info">
                                    <div className="danni-author">
                                        制作者: {danni.author}
                                        {danni.isCleared && <span className="clear-mark">✓</span>}
                                    </div>
                                    
                                    <div className="danni-stats">
                                        <span className="pass-count">合格者: {danni.passCount}人</span>
                                        <span className="chart-count">譜面数: {danni.charts.length}曲</span>
                                    </div>

                                    <div className="danni-tags">
                                        {danni.tags.map(tag => (
                                            <span key={tag} className="danni-tag">{tag}</span>
                                        ))}
                                    </div>

                                    <div className="danni-condition">
                                        合格条件: {getPassConditionText(danni.passCondition)}
                                        {danni.passCondition.isOverall && <span className="overall-condition"> (段位全体)</span>}
                                    </div>

                                    <div className="danni-meta">
                                        <span className="creation-date">
                                            作成: {new Date(danni.createdAt).toLocaleDateString('ja-JP')}
                                        </span>
                                        {danni.continuousPlay && (
                                            <span className="continuous-play">連続プレイ必須</span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DanniList;