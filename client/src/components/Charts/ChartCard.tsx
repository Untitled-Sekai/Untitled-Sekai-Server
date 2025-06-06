// filepath: [ChartCard.tsx](http://_vscodecontentref_/7)
import React from 'react';
import { Link } from 'react-router-dom';
import './ChartCard.css';

interface ChartCardProps {
  chart: {
    name: string;
    title: string;
    artist: string;
    author: string;
    rating: number;
    uploadDate: string;
    coverUrl: string;
    meta?: {
      isPublic: boolean;
      collaboration?: {
        iscollaboration: boolean;
      };
    };
  };
  showCollabBadge?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({ chart, showCollabBadge }) => {
  // アップロード日の整形
  const formattedDate = new Date(chart.uploadDate).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <Link to={`/charts/${chart.name}`} className="chart-card">
      <div className="chart-cover">
        <img src={chart.coverUrl || '/placeholder-cover.jpg'} alt={chart.title} />
        <div className="chart-rating">{chart.rating}</div>
        
        {/* 非公開譜面バッジ */}
        {chart.meta?.isPublic === false && (
          <div className="chart-badge private">非公開</div>
        )}
        
        {/* 合作譜面バッジ */}
        {(chart.meta?.collaboration?.iscollaboration || showCollabBadge) && (
          <div className="chart-badge collab">合作</div>
        )}
      </div>
      
      <div className="chart-info">
        <h3 className="chart-title">{chart.title}</h3>
        <p className="chart-artist">{chart.artist}</p>
        <div className="chart-footer">
          <span className="chart-author">{chart.author}</span>
          <span className="chart-date">{formattedDate}</span>
        </div>
      </div>
    </Link>
  );
};

export default ChartCard;