import { useLocation, Link } from 'react-router-dom';
import './BannedPage.css';

interface BanInfo {
    banned: boolean;
    permanent: boolean;
    message: string;
    reason: string;
    timeoutUntil?: string;
    daysLeft?: number;
    bannedBy?: string;
    banDate?: string;
}

const BannedPage = () => {
    const location = useLocation();
    const banInfo: BanInfo = location.state || {
        banned: true,
        permanent: true,
        message: 'アカウントがBANされました。',
        reason: '理由は不明です。'
    };
    
    return (
        <div className="banned-container">
            <div className="banned-card">
                <div className="banned-header">
                    <h1>{banInfo.permanent ? '🚫 アカウント永久BAN' : '⏳ アカウントタイムアウト'}</h1>
                </div>
                
                <div className="banned-content">
                    <p className="banned-message">{banInfo.message}</p>
                    
                    <div className="banned-details">
                        <div className="detail-item">
                            <span className="detail-label">理由:</span>
                            <span className="detail-value">{banInfo.reason}</span>
                        </div>
                        
                        {!banInfo.permanent && banInfo.timeoutUntil && (
                            <div className="detail-item">
                                <span className="detail-label">解除日時:</span>
                                <span className="detail-value">
                                    {new Date(banInfo.timeoutUntil).toLocaleString('ja-JP')}
                                </span>
                            </div>
                        )}
                        
                        {!banInfo.permanent && banInfo.daysLeft && (
                            <div className="detail-item">
                                <span className="detail-label">残り日数:</span>
                                <span className="detail-value">{banInfo.daysLeft}日</span>
                            </div>
                        )}
                        
                        {banInfo.bannedBy && (
                            <div className="detail-item">
                                <span className="detail-label">BANした人:</span>
                                <span className="detail-value">{banInfo.bannedBy}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="banned-footer">
                        <p>
                            この措置に関するお問い合わせは、
                            <a href="http://discordapp.com/users/1064193574293471252">サポート</a>
                            までお願いします。
                        </p>
                        <Link to="/" className="home-link">ホームに戻る</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannedPage;