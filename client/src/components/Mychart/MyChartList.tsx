import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './MyChartList.css';

interface ChartData {
  name: string;
  title: string;
  artist: string;
  author: string;
  rating: number;
  uploadDate: string;
  coverUrl: string;
  description: string;
  tags: string[];
  meta: {
    isPublic: boolean;
    collaboration: {
      iscollaboration: boolean;
    }
  };
  isCollab?: boolean;
}

interface MyChartListProps {
  username: string;
  isCurrentUser?: boolean;
  type?: 'uploaded' | 'liked';
  limit?: number;
  layout?: 'vertical' | 'horizontal';
}

const MyChartList: React.FC<MyChartListProps> = ({
  username,
  isCurrentUser = false,
  type = 'uploaded',
  limit
}) => {
  const [charts, setCharts] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCharts = async () => {
      setLoading(true);
      try {
        const endpoint = type === 'liked'
          ? `/api/charts/liked/user/${username}`
          : `/api/charts/user/${username}`;

        const requestOptions: RequestInit = {};

        if (isCurrentUser) {
          const token = localStorage.getItem('token');
          if (token) {
            requestOptions.headers = {
              'Authorization': `Bearer ${token}`
            };
          }
        }

        const response = await fetch(endpoint, requestOptions);
        if (!response.ok) {
          throw new Error('譜面の取得に失敗');
        }

        const data = await response.json();
        if (data.success) {
          setCharts(data.data);
        } else {
          throw new Error(data.message || '譜面の取得に失敗');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '譜面の取得に失敗');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchCharts();
    }
  }, [username, type, isCurrentUser]);

  if (loading) {
    return <div className="charts-loading">譜面読み込み中...</div>;
  }

  if (error) {
    return <div className="charts-error">{error}</div>;
  }

  const displayCharts = isCurrentUser ? charts : charts.filter(chart => chart.meta.isPublic);

  const limitedCharts = limit ? displayCharts.slice(0, limit) : displayCharts;

  if (limitedCharts.length === 0) {
    return <div className="charts-empty">
      {type === 'liked' ? 'いいねした譜面がありません。' : '譜面がありません。'}
    </div>;
  }

  return (
    <div className="charts-list">
      {limitedCharts.map((chart) => (
        <Link to={`/charts/${chart.name}`} key={chart.name} className="chart-card">
          <div className="chart-cover">
            {chart.coverUrl ? (
              <img src={chart.coverUrl} alt={`${chart.title}のカバー`} />
            ) : (
              <div className="chart-cover-placeholder">No Cover</div>
            )}
          </div>
          <div className="chart-info">
            <h3 className="chart-title">{chart.title}</h3>
            <p className="chart-artist">{chart.artist}</p>
            <div className="chart-meta">
              <span className="chart-rating">難易度{chart.rating}</span>
              {chart.isCollab && <span className="chart-collab-badge">合作</span>}
              {chart.meta.isPublic ?
                <span className="chart-status-public">公開中</span> :
                <span className="chart-status-private">非公開</span>
              }
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default MyChartList;