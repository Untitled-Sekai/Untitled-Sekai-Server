import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface CollaborationMemberProps {
  handle: number;
}

const CollaborationMember: React.FC<CollaborationMemberProps> = ({ handle }) => {
  const [userData, setUserData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserByHandle = async () => {
      try {
        setIsLoading(true);
        
        const response = await fetch(`/api/users/handle/${handle.toString()}`);
        
        if (!response.ok) {
          throw new Error('ユーザー情報取れませんでした');
        }
        
        const data = await response.json();
        console.log('取得できたユーザー:', data);
        setUserData(data);
      } catch (err) {
        console.error('ユーザー取得エラー:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserByHandle();
  }, [handle]);

  if (isLoading) {
    return <span className="collab-member loading">読み込み中...</span>;
  }

  if (error || !userData) {
    return (
      <span className="collab-member error">
        <span className="unknown-user">不明なユーザー#{handle}</span>
      </span>
    );
  }

  const profileColor = userData.profile?.iconColor || '#6c5ce7';
  const initial = userData.username.charAt(0).toUpperCase();

  return (
    <Link to={`/profile/${encodeURIComponent(userData.username)}`} className="collab-member">
      <div className="member-avatar" style={{ backgroundColor: profileColor }}>{initial}</div>
      <div className="member-info">
        <span className="member-name">{userData.username}</span>
        {userData.sonolusProfile && (
          <span className="member-handle">#{userData.sonolusProfile.handle}</span>
        )}
      </div>
    </Link>
  );
  
};

export default CollaborationMember;
