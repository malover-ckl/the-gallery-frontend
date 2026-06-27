import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import PreferencePanel from '../components/PreferencePanel';
import AlbumGrid from '../components/AlbumGrid';
import CompanionDownload from '../components/CompanionDownload';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || '';

export default function Dashboard() {
  const [searchParams]  = useSearchParams();
  const userId          = searchParams.get('user_id');

  const [user, setUser]         = useState(null);
  const [albums, setAlbums]     = useState([]);
  const [loading, setLoading]   = useState(false);
  const [prefs, setPrefs]       = useState(null);
  const [saved, setSaved]       = useState(false);

  // Load user + preferences
  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/auth/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setUser(data);
        setPrefs(data.preferences);
      });
  }, [userId]);

  // Load album preview
  const loadPreview = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API}/api/preview/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setAlbums(data.albums || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => { if (prefs) loadPreview(); }, [prefs, loadPreview]);

  const savePrefs = async (newPrefs) => {
    setPrefs(newPrefs);
    await fetch(`${API}/auth/preferences/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(newPrefs),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    loadPreview();
  };

  const downloadWallpaper = () => {
    window.open(`${API}/api/wallpaper/${userId}`, '_blank');
  };

  if (!userId) return <div className="dash-error">No user ID found. <a href="/">Go back</a></div>;
  if (!user || !prefs) return <div className="dash-loading"><div className="spinner" />Loading your gallery…</div>;

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <span className="nav-logo">The Gallery</span>
        <span className="dash-welcome">
          {user.display_name ? `${user.display_name}'s gallery` : 'Your gallery'}
        </span>
      </nav>

      <div className="dash-body">
        <aside className="dash-sidebar">
          <PreferencePanel prefs={prefs} onSave={savePrefs} saved={saved} />
          <CompanionDownload userId={userId} apiUrl={API} />
        </aside>

        <main className="dash-main">
          <div className="dash-main-header">
            <div>
              <h2 className="dash-title">Your wallpaper</h2>
              <p className="dash-subtitle">
                {albums.length} albums · {prefs.grid_cols}×{prefs.grid_rows} grid · {prefs.canvas_w}×{prefs.canvas_h}
              </p>
            </div>
            <button className="btn-download" onClick={downloadWallpaper}>
              Download wallpaper
            </button>
          </div>

          {loading
            ? <div className="preview-loading"><div className="spinner" />Building preview…</div>
            : <AlbumGrid albums={albums} cols={prefs.grid_cols} rows={prefs.grid_rows} gap={prefs.gap_px} />
          }
        </main>
      </div>
    </div>
  );
}
