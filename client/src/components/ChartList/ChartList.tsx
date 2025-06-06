import React, { useEffect, useState } from 'react';
import './ChartList.css';
import { ChartSummary as Chart } from '../../../../src/models/level';

// 難易度タグの定義
const DIFFICULTY_TAGS = [
    { value: 'Easy', label: 'Easy', color: '#77c766' },
    { value: 'Normal', label: 'Normal', color: '#4a90e2' },
    { value: 'Hard', label: 'Hard', color: '#f5a623' },
    { value: 'Expert', label: 'Expert', color: '#e74c3c' },
    { value: 'Master', label: 'Master', color: '#9b59b6' },
    { value: 'APPEND', label: 'APPEND', color: '#fcacfa' },
    { value: 'Other', label: 'Other', color: '#95a5a6' }
];

const ITEMS_PER_PAGE = 20;

export const ChartList: React.FC = () => {
    const [charts, setCharts] = useState<Chart[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // 検索用のstate
    const [searchQuery, setSearchQuery] = useState('');
    const [searchCategory, setSearchCategory] = useState('all');
    const [difficultyFilter, setDifficultyFilter] = useState('all');
    const [minRating, setMinRating] = useState('');
    const [maxRating, setMaxRating] = useState('');

    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        const fetchCharts = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/charts');

                if (!response.ok) {
                    throw new Error('ネットワークエラー');
                }

                const result = await response.json();
                console.log('取得したデータ:', result);

                if (result.success) {
                    const formattedCharts = result.data.map((item: any) => {
                        const formattedTags = item.tags && Array.isArray(item.tags)
                            ? item.tags.map((tag: any) => {
                                if (tag && tag.title) {
                                    if (typeof tag.title === 'object') {
                                        return tag.title.ja || tag.title.en || 'タグ';
                                    }
                                    return tag.title;
                                }
                                return 'タグ';
                            })
                            : [];

                        return {
                            ...item,
                            tags: formattedTags
                        };
                    });

                    setCharts(formattedCharts);
                    console.log('変換後のデータ:', formattedCharts);
                } else {
                    throw new Error(result.message || 'データの取得に失敗');
                }
            } catch (err) {
                console.error('エラー:', err);
                setError(err instanceof Error ? err.message : '不明なエラー');
            } finally {
                setLoading(false);
            }
        };

        fetchCharts();
    }, []);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, searchCategory, difficultyFilter, minRating, maxRating]);

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    };

    // 検索ロジック
    const filteredCharts = charts
        .filter(chart => chart.meta?.isPublic !== false)
        .filter(chart => {
            // 検索クエリでフィルタリング
            if (!searchQuery) return true;

            const query = searchQuery.toLowerCase();

            switch (searchCategory) {
                case 'title':
                    return chart.title.toLowerCase().includes(query);
                case 'artist':
                    return chart.artist.toLowerCase().includes(query);
                case 'author':
                    return chart.author.toLowerCase().includes(query);
                case 'all':
                default:
                    return (
                        chart.title.toLowerCase().includes(query) ||
                        chart.artist.toLowerCase().includes(query) ||
                        chart.author.toLowerCase().includes(query)
                    );
            }
        })
        .filter(chart => {
            // 難易度タグでフィルタリング
            if (difficultyFilter === 'all') return true;

            // difficultyTagがchartオブジェクトに存在すると仮定
            // 実際のデータ構造に合わせて調整してください
            return chart.tags && chart.tags.includes(difficultyFilter);
        })
        .filter(chart => {
            // 難易度レベルの範囲でフィルタリング
            const min = minRating ? parseFloat(minRating) : 0;
            const max = maxRating ? parseFloat(maxRating) : Infinity;
            const chartRating = parseFloat(chart.rating.toString());

            return chartRating >= min && chartRating <= max;
        });

    const totalPages = Math.ceil(filteredCharts.length / ITEMS_PER_PAGE);
    const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
    const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
    const currentCharts = filteredCharts.slice(indexOfFirstItem, indexOfLastItem);

    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
        window.scrollTo(0, 0);
    }

    const Pagination = () => {
        if (totalPages <= 1) return null;

        // 表示するページ番号を計算（現在のページの前後2ページまで表示）
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);

        // 表示するページ数を調整（常に最大5ページ表示）
        if (endPage - startPage < 4 && totalPages > 5) {
            if (currentPage <= 3) {
                endPage = Math.min(5, totalPages);
            } else if (currentPage >= totalPages - 2) {
                startPage = Math.max(1, totalPages - 4);
            }
        }

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="pagination">
                {currentPage > 1 && (
                    <button
                        className="pagination-button prev"
                        onClick={() => handlePageChange(currentPage - 1)}
                    >
                        前へ
                    </button>
                )}

                {startPage > 1 && (
                    <>
                        <button
                            className="pagination-button"
                            onClick={() => handlePageChange(1)}
                        >
                            1
                        </button>
                        {startPage > 2 && <span className="pagination-ellipsis">...</span>}
                    </>
                )}

                {pageNumbers.map(number => (
                    <button
                        key={number}
                        className={`pagination-button ${number === currentPage ? 'active' : ''}`}
                        onClick={() => handlePageChange(number)}
                    >
                        {number}
                    </button>
                ))}

                {endPage < totalPages && (
                    <>
                        {endPage < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
                        <button
                            className="pagination-button"
                            onClick={() => handlePageChange(totalPages)}
                        >
                            {totalPages}
                        </button>
                    </>
                )}

                {currentPage < totalPages && (
                    <button
                        className="pagination-button next"
                        onClick={() => handlePageChange(currentPage + 1)}
                    >
                        次へ
                    </button>
                )}
            </div>
        );
    };

    if (loading) {
        return <div className="loading-container">読込中</div>;
    }

    if (error) {
        return <div className="error-container">エラー: {error}</div>;
    }

    return (
        <div className="chart-list-container">
            <h1 className="chart-list-title">譜面一覧</h1>

            {/* 検索フォーム */}
            <div className="search-container">
                <div className="search-box">
                    <input
                        type="text"
                        className="search-input"
                        placeholder="検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <select
                        className="search-category"
                        value={searchCategory}
                        onChange={(e) => setSearchCategory(e.target.value)}
                    >
                        <option value="all">すべて</option>
                        <option value="title">タイトル</option>
                        <option value="artist">アーティスト</option>
                        <option value="author">作者</option>
                    </select>
                </div>

                <div className="filter-options">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label>難易度: </label>
                            <select
                                className="difficulty-select"
                                value={difficultyFilter}
                                onChange={(e) => setDifficultyFilter(e.target.value)}
                            >
                                <option value="all">すべて</option>
                                {DIFFICULTY_TAGS.map(tag => (
                                    <option key={tag.value} value={tag.value}>
                                        {tag.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="rating-filter">
                            <label>レベル: </label>
                            <input
                                type="number"
                                className="rating-input"
                                placeholder="最小"
                                min="1"
                                value={minRating}
                                onChange={(e) => setMinRating(e.target.value)}
                            />
                            <span>～</span>
                            <input
                                type="number"
                                className="rating-input"
                                placeholder="最大"
                                min="1"
                                value={maxRating}
                                onChange={(e) => setMaxRating(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="search-results-count">
                    {filteredCharts.length} 件の譜面が見つかりました
                </div>
            </div>

            {filteredCharts.length === 0 ? (
                <div className="no-results">検索条件に一致する譜面がありません</div>
            ) : (
                <>
                    <div className="chart-grid">
                        {currentCharts.map((chart) => (
                            <a
                                href={`/charts/${chart.name}`}
                                className="chart-card"
                                key={chart.name}
                            >
                                <div className="chart-image-container">
                                    <img
                                        src={chart.coverUrl !== "Unknown" ? chart.coverUrl : '/default-cover.jpg'}
                                        alt={chart.title}
                                        className="chart-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = '/default-cover.jpg';
                                        }}
                                    />
                                </div>
                                <div className="chart-info">
                                    <h3 className="chart-title">{chart.title}</h3>
                                    <p className="chart-artist">{chart.artist}</p>
                                    <div className="chart-details">
                                        <p className="chart-author">作者: {chart.author}</p>
                                        <div className="chart-rating">
                                            難易度: <span className="difficulty-number">{chart.rating}</span>
                                        </div>
                                        <p className="chart-date">投稿日: {formatDate(chart.uploadDate)}</p>
                                    </div>
                                    <div className="chart-tags">
                                        {chart.tags && chart.tags.map((tag, index) => (
                                            <span key={index} className="chart-tag">{tag}</span>
                                        ))}
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                    <Pagination />
                </>
            )}
        </div>
    );
};

export default ChartList;