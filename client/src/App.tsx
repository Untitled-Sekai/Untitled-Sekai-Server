import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import Home from './components/Home/Home';
import ChartList from './components/ChartList/ChartList';
import ChartDetail from './components/ChartDetail/ChartDetail';
import ChartEdit from './components/ChartEdit/ChartEdit';
import Settings from './components/Settings/Settings';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import { LanguageProvider } from './context/LanguageContext';
import Upload from './components/Upload/Upload';
import About from './components/About/About';
import Profile from './components/Profile/Profile';
import UserChartsPage from './components/Mychart/UserChartsPage';
import LikedChartsPage from './components/Mychart/LikedChartsPage';
import BanManager from './components/Admin/BanManager';
import AdminDashboard from './components/Admin/AdminDashboard';
import BanChecker from './components/Auth/BanChecker';
import BannedPage from './components/Auth/BannedPage';
import AnonymousManager from './components/Anonymous/AnonymousManager';
import './App.css';
import { HelmetProvider } from 'react-helmet-async';

const Header = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername);
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userNumber');
    setUsername(null);
    setIsMenuOpen(false);
    navigate('/');
  };

  const goToMyPage = () => {
    setIsMenuOpen(false);
    navigate('/profile');
  };

  const goToMyCharts = () => {
    setIsMenuOpen(false);
    if (username) {
      navigate(`/users/${username}/charts`);
    }
  };

  const goToLikedCharts = () => {
    setIsMenuOpen(false);
    if (username) {
      navigate(`/users/${username}/liked`);
    }
  };

  return (
    <header className="app-header">
      <h1><Link to="/">Untitled Sekai</Link></h1>
      <nav>
        <ul>
          <li><Link to="/">ホーム</Link></li>
          <li><Link to="/charts">譜面一覧</Link></li>
          <li><Link to="/upload">アップロード</Link></li>
          <li><Link to="/about">About</Link></li>
          <li><Link to="/settings">設定</Link></li>
          
          {username ? (
            <li className="user-menu-container" ref={menuRef}>
              <div 
                className="user-menu-trigger"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                <span className="username">{username}</span>
                <span className="dropdown-icon">{isMenuOpen ? '▲' : '▼'}</span>
              </div>
              
              {isMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={goToMyPage}>
                    プロフィール
                  </div>
                  <div className="dropdown-item" onClick={goToMyCharts}>
                    自分の譜面
                  </div>
                  <div className="dropdown-item" onClick={goToLikedCharts}>
                    お気に入り
                  </div>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-item logout" onClick={handleLogout}>
                    ログアウト
                  </div>
                </div>
              )}
            </li>
          ) : (
            <li><Link to="/login">ログイン</Link></li>
          )}
        </ul>
      </nav>
    </header>
  );
};


function App() {
  return (
    <HelmetProvider>
    <LanguageProvider>
      <BrowserRouter>
        <div className="app">
          <Header />
          <BanChecker />

          <main>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/charts" element={<ChartList />} />
              <Route path="/charts/:id" element={<ChartDetail />} />
              <Route path="/edit/:id" element={<ChartEdit />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/about" element={<About />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/users/:username/charts" element={<UserChartsPage />} />
              <Route path="/users/:username/liked" element={<LikedChartsPage />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/ban" element={<BanManager />} />
              <Route path="/banned" element={<BannedPage />} />
              <Route path="/anonymous-manager" element={<AnonymousManager />} />
            </Routes>
          </main>

          <footer>
            <p>© 2025 Untitled_Sekai - pim4n</p>
          </footer>
        </div>
      </BrowserRouter>
    </LanguageProvider>
    </HelmetProvider>
  )
}

export default App;