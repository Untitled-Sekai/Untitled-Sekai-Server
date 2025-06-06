import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface BanInfo {
    banned: boolean;
    permanent: boolean;
    message: string;
    reason: string;
    timeoutUntil?: string;
    daysLeft?: number;
}

const BanChecker = () => {
    const navigate = useNavigate();
    const [checking, setChecking] = useState(true);
    useEffect(() => {
        const checkBanStatus = async () => {
            checking && setChecking(true);
            const token = localStorage.getItem('token');
            if (!token) {
                setChecking(false);
                return;
            }
            
            try {
                // 何かしらの認証が必要なAPIを呼び出す
                const response = await fetch('/api/me', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                // 403ならBANされてる
                if (response.status === 403) {
                    const data: BanInfo = await response.json();
                    
                    if (data.banned) {
                        // ローカルストレージクリア
                        localStorage.removeItem('token');
                        localStorage.removeItem('username');
                        
                        // BANページに移動
                        navigate('/banned', { state: data });
                    }
                }
            } catch (error) {
                console.error('Ban check error:', error);
            } finally {
                setChecking(false);
            }
        };
        
        checkBanStatus();
        
        // 定期的にBANチェック（5分ごと）
        const intervalId = setInterval(checkBanStatus, 5 * 60 * 1000);
        
        return () => clearInterval(intervalId);
    }, [navigate]);
    
    return null; // このコンポーネントは何も描画しない
};

export default BanChecker;