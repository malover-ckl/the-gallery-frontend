import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PreferencePanel from '../components/PreferencePanel';
import AlbumGrid from '../components/AlbumGrid';
import CompanionDownload from '../components/CompanionDownload';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || '';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const userId         = searchParams.get('user_id');

  const [user, setUser]             = useState(null);
  const [albums, setAlbums]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [prefs, setPrefs]           = useState(null);
  const [saved, setSaved]           = useState(false);
  const [isCustom, setIsCustom]     = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);

  // Search modal state
  const [replaceIndex, setReplaceIndex] = useState(null);
  const [searchQuery, setSearchQuery]   = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]       = useState(false);
  const searchTimeout = useRef(null);

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
      .then(data => {
        setAlbums(data.albums || []);
        setIsCustom(data.is_custom || false);
        setLoading(false);
      })
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

  const saveLayout = async (newAlbums) => {
    await fetch(`${API}/api/layout/${userId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ albums: newAlbums }),
    });
    setIsCustom(true);
    setLayoutSaved(true);
    setTimeout(() => setLayoutSaved(false), 2000);
  };

  const resetLayout = async () => {
    await fetch(`${API}/api/layout/${userId}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    setIsCustom(false);
    loadPreview();
  };

  const handleReorder = (newAlbums) => {
    setAlbums(newAlbums);
    saveLayout(newAlbums);
  };

  const handleReplace = (index) => {
    setReplaceIndex(index);
    setSearchQuery('');
    setSearchResults([]);
  };

  // Live search as you type
  const handleSearchInput = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!q.trim()) { setSearchResults([]); return; }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`${API}/api/search/${userId}?q=${encodeURIComponent(q)}`, {
          credentials: 'include',
        });
        const data = await r.json();
        setSearchResults(data.results || []);
      } catch {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
  };

  const handlePick = (album) => {
    const newAlbums = [...albums];
    newAlbums[replaceIndex] = album;
    setAlbums(newAlbums);
    saveLayout(newAlbums);
    setReplaceIndex(null);
    setSearchResults([]);
    setSearchQuery('');
  };

  const downloadWallpaper = () => {
    window.open(`${API}/api/wallpaper/${userId}`, '_blank');
  };

  if (!userId) return <div className="dash-error">No user ID found. <a href="/">Go back</a></div>;
  if (!user || !prefs) return <div className="dash-loading"><div className="spinner" />Loading your gallery...</div>;

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
            <div className="dash-main-actions">
              {isCustom && (
                <button className="btn-reset" onClick={resetLayout}>
                  Reset to Spotify order
                </button>
              )}
              {layoutSaved && <span className="layout-saved">Layout saved ✓</span>}
              <button className="btn-download" onClick={downloadWallpaper}>
                Download wallpaper
              </button>
            </div>
          </div>

          {loading
            ? <div className="preview-loading"><div className="spinner" />Building preview...</div>
            : <AlbumGrid
                albums={albums}
                cols={prefs.grid_cols}
                rows={prefs.grid_rows}
                gap={prefs.gap_px}
                onReorder={handleReorder}
                onReplace={handleReplace}
              />
          }
        </main>
      </div>

      {/* Replace modal */}
      {replaceIndex !== null && (
        <div className="modal-backdrop" onClick={() => setReplaceIndex(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Replace album #{replaceIndex + 1}</h3>
              <button className="modal-close" onClick={() => setReplaceIndex(null)}>✕</button>
            </div>
            <div className="modal-search">
              <input
                autoFocus
                type="text"
                placeholder="Search for an album..."
                value={searchQuery}
                onChange={handleSearchInput}
                className="modal-input"
              />
            </div>
            <div className="modal-results">
              {searching && (
                <div className="modal-searching">
                  <div className="spinner" /> Searching...
                </div>
              )}
              {!searching && searchResults.map((album, i) => (
                <div key={i} className="modal-result" onClick={() => handlePick(album)}>
                  <img src={album.url} alt={album.name} />
                  <div className="modal-result-info">
                    <span className="modal-result-name">{album.name}</span>
                    <span className="modal-result-artist">{album.artist}</span>
                  </div>
                </div>
              ))}
              {!searching && searchResults.length === 0 && searchQuery && (
                <p className="modal-empty">No results found.</p>
              )}
              {!searching && !searchQuery && (
                <p className="modal-empty">Start typing to search Spotify...</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}