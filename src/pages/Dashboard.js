import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import PreferencePanel from '../components/PreferencePanel';
import AlbumGrid from '../components/AlbumGrid';
import CompanionDownload from '../components/CompanionDownload';
import { sortAlbumsByColor } from '../colorUtils';
import './Dashboard.css';

const API = process.env.REACT_APP_API_URL || '';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const userId         = searchParams.get('user_id');

  const [user, setUser]               = useState(null);
  const [albums, setAlbums]           = useState([]);
  const [loading, setLoading]         = useState(false);
  const [prefs, setPrefs]             = useState(null);
  const [saved, setSaved]             = useState(false);
  const [isCustom, setIsCustom]       = useState(false);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [balancing, setBalancing]     = useState(false);

  const [replaceIndex, setReplaceIndex]     = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const searchTimeout = useRef(null);

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/auth/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => { setUser(data); setPrefs(data.preferences); });
  }, [userId]);

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

  const handleShuffle = () => {
    const shuffled = [...albums];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    handleReorder(shuffled);
  };

  const handleColorBalance = async () => {
    if (balancing || albums.length === 0) return;
    setBalancing(true);
    try {
      const sorted = await sortAlbumsByColor(albums);
      handleReorder(sorted);
    } finally {
      setBalancing(false);
    }
  };

  const handleReplace = (index) => {
    setReplaceIndex(index === replaceIndex ? null : index);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleCloseReplace = () => {
    setReplaceIndex(null);
    setSearchQuery('');
    setSearchResults([]);
  };

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
        <div className="dash-sidebar">

          <PreferencePanel
            prefs={prefs}
            onSave={savePrefs}
            saved={saved}
            onShuffle={handleShuffle}
            onColorBalance={handleColorBalance}
            colorBalancing={balancing}
            isCustom={isCustom}
          />

          <CompanionDownload userId={userId} />
        </div>

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
                replaceIndex={replaceIndex}
                searchQuery={searchQuery}
                searchResults={searchResults}
                searching={searching}
                onSearchInput={handleSearchInput}
                onPick={handlePick}
                onCloseReplace={handleCloseReplace}
              />
          }
        </main>
      </div>
    </div>
  );
}