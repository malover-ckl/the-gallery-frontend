import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import PreferencePanel from '../components/PreferencePanel';
import AlbumGrid from '../components/AlbumGrid';
import CompanionDownload from '../components/CompanionDownload';
import { sortAlbumsByColor } from '../colorUtils';
import { pickBestGrid } from '../gridOptions';
import FitToHeight from '../components/FitToHeight'; 
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
  const [showOnboarding, setShowOnboarding] = useState(false);
  const prefsRef = useRef(null);
  const savePrefsRef = useRef(null);

  // Replace popover state
  const [replaceIndex, setReplaceIndex]     = useState(null);
  const [searchQuery, setSearchQuery]       = useState('');
  const [searchResults, setSearchResults]   = useState([]);
  const [searching, setSearching]           = useState(false);
  const searchTimeout = useRef(null);

  // Reads the actual screen's pixel dimensions (accounting for HiDPI/Retina
  // displays via devicePixelRatio) so the downloaded wallpaper file matches
  // the screen it'll actually be displayed on, with no manual picker needed.
  const detectScreenResolution = () => {
    const dpr = window.devicePixelRatio || 1;
    const w = Math.round((window.screen.width || 1920) * dpr);
    const h = Math.round((window.screen.height || 1080) * dpr);
    return { w, h };
  };

  useEffect(() => {
    if (!userId) return;
    const dismissed = window.localStorage.getItem('gallery_onboarding_dismissed');
    if (!dismissed) setShowOnboarding(true);
  }, [userId]);

  const dismissOnboarding = () => {
    setShowOnboarding(false);
    window.localStorage.setItem('gallery_onboarding_dismissed', 'true');
  };

  useEffect(() => {
    if (!userId) return;
    fetch(`${API}/auth/user/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => {
        setUser(data);
        const fetchedPrefs = data.preferences;
        const { w, h } = detectScreenResolution();

        // Auto-pick the grid whose aspect ratio best matches this screen.
        // This runs on every fresh page load (this effect only fires once
        // per mount, on userId), so it never fights the user mid-session —
        // once they load in, they're free to change the grid via the
        // dropdown and it'll stick until they reload or revisit.
        const bestGrid = pickBestGrid(w, h);

        const resolutionChanged = fetchedPrefs.canvas_w !== w || fetchedPrefs.canvas_h !== h;
        const gridChanged = fetchedPrefs.grid_cols !== bestGrid.cols || fetchedPrefs.grid_rows !== bestGrid.rows;

        // Only save if something actually differs from what's stored —
        // avoids an unnecessary extra save/reload on every single visit.
        // savePrefsRef is used (rather than calling savePrefs directly)
        // because savePrefs is defined further down and depends on userId,
        // which is already in scope here via closure — see ref note below.
        if (resolutionChanged || gridChanged) {
          savePrefsRef.current({
            ...fetchedPrefs,
            canvas_w: w,
            canvas_h: h,
            grid_cols: bestGrid.cols,
            grid_rows: bestGrid.rows,
          });
        } else {
          setPrefs(fetchedPrefs);
        }
      });
  }, [userId]);

  const loadPreview = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API}/api/preview/${userId}`, { credentials: 'include' })
      .then(r => r.json())
      .then(async (data) => {
        const fetchedAlbums = data.albums || [];
        const custom = data.is_custom || false;
        setIsCustom(custom);

        // If the person hasn't customized their layout yet, auto-balance
        // colors for display (first visit, and any time the grid size
        // changes and re-fetches a fresh, non-custom preview). This is
        // purely a display default — it's not saved as a custom layout,
        // so is_custom stays false and "Reset to Spotify order" stays
        // hidden until the person actually drags or replaces something.
        if (!custom && fetchedAlbums.length > 0 && prefsRef.current) {
          setAlbums(fetchedAlbums);
          setLoading(false);
          setBalancing(true);
          try {
            const sorted = await sortAlbumsByColor(fetchedAlbums, prefsRef.current.grid_cols);
            setAlbums(sorted);
          } finally {
            setBalancing(false);
          }
        } else {
          setAlbums(fetchedAlbums);
          setLoading(false);
        }
      })
      .catch(() => setLoading(false));
  }, [userId]);

  useEffect(() => { if (prefs) loadPreview(); }, [prefs, loadPreview]);
  useEffect(() => { prefsRef.current = prefs; }, [prefs]);

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
  savePrefsRef.current = savePrefs;

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
      const sorted = await sortAlbumsByColor(albums, prefs.grid_cols);
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
  if (!user || !prefs) return <div className="dash-loading"><div className="spinner" />Loading your discography...</div>;

  return (
    <div className="dashboard">
      <nav className="dash-nav">
        <Link to="/" className="nav-logo">Discography</Link>
        <span className="dash-welcome">
          {user.display_name ? `${user.display_name}'s discography` : 'Your gallery'}
        </span>
      </nav>

      <div className="dash-body">
        {/* SIDEBAR */}
        <div className="dash-sidebar">

           <FitToHeight className="sidebar-fit-content">
    <PreferencePanel
      prefs={prefs}
      onSave={savePrefs}
      saved={saved}
      onShuffle={handleShuffle}
      onColorBalance={handleColorBalance}
      colorBalancing={balancing}
      isCustom={isCustom}
    />
    <CompanionDownload userId={userId} apiUrl={API} />
  </FitToHeight>
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
              <button className="btn-download" onClick={downloadWallpaper}>
                Download wallpaper
              </button>
              {(isCustom || layoutSaved) && (
                <div className="dash-secondary-actions">
                  {layoutSaved && <span className="layout-saved">Layout saved ✓</span>}
                  {isCustom && (
                    <button className="btn-reset" onClick={resetLayout}>
                      Reset to Spotify order
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {showOnboarding && (
            <div className="onboarding-banner">
              <p>
                <strong>Tip:</strong> drag any cover to reorder it, or hover and click the
                ↻ icon to swap it for a different album.
              </p>
              <button className="onboarding-dismiss" onClick={dismissOnboarding}>
                Got it
              </button>
            </div>
          )}

          <div className="grid-stage">
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
          </div>

        </main>
      </div>
    </div>
  );


}