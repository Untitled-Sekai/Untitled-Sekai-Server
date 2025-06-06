import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './Settings.css';

const Settings: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="settings">
      <h1>{language === 'ja' ? '設定' : 'Settings'}</h1>
      
      <div className="settings-section">
        <h2>{language === 'ja' ? '言語設定' : 'Language'}</h2>
        
        <div className="language-selector">
          <button 
            className={`language-button ${language === 'ja' ? 'active' : ''}`}
            onClick={() => setLanguage('ja')}
          >
            🇯🇵 日本語
          </button>
          
          <button 
            className={`language-button ${language === 'en' ? 'active' : ''}`}
            onClick={() => setLanguage('en')}
          >
            🇺🇸 English
          </button>
        </div>
        
        <p className="language-info">
          {language === 'ja' 
            ? 'ここで言語を切り替えると、アプリ全体の表示言語が変わります。'
            : 'Switching language here will change the display language throughout the app.'}
        </p>
      </div>
      
      <div className="settings-footer">
        {language === 'ja' 
          ? '設定は自動的に保存されます。' 
          : 'Settings are saved automatically.'}
      </div>
    </div>
  );
};

export default Settings;