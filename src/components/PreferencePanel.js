import React, { useState, useEffect } from 'react';
import './PreferencePanel.css';

const TIME_RANGES = [
  { value: 'short_term',  label: 'Last 4 weeks' },
  { value: 'medium_term', label: 'Last 6 months' },
  { value: 'long_term',   label: 'All time' },
];

const GRIDS = [
  { cols: 8,  rows: 5, label: '8 × 5  (40 albums)' },
  { cols: 10, rows: 6, label: '10 × 6  (60 albums)' },
  { cols: 12, rows: 6, label: '12 × 6  (72 albums)' },
];

const GAPS = [
  { value: 0,  label: 'None' },
  { value: 3,  label: 'Tiny' },
  { value: 6,  label: 'Small' },
];

const INTERVALS = [
  { value: 1,  label: 'Every hour' },
  { value: 6,  label: 'Every 6 hours' },
  { value: 24, label: 'Daily' },
];

export default function PreferencePanel({ prefs, onSave, saved, onShuffle, isCustom }) {
  const [local, setLocal] = useState({ ...prefs });

  // Keep local state perfectly in sync if dashboard updates it
  useEffect(() => {
    setLocal({ ...prefs });
  }, [prefs]);

  // Instantly update the local UI and trigger the save/refresh
  const updateAndSave = (newPrefs) => {
    setLocal(newPrefs);
    onSave(newPrefs);
  };

  const set = (key, val) => updateAndSave({ ...local, [key]: val });

  const handleGridChange = (cols, rows) => {
    updateAndSave({ ...local, grid_cols: cols, grid_rows: rows });
  };

  const autoDetectLayout = () => {
    const screenW = window.screen.width;
    const screenH = window.screen.height;
    const targetTileSize = 192;
    
    const bestCols = Math.floor(screenW / targetTileSize);
    const bestRows = Math.floor(screenH / targetTileSize);

    updateAndSave({ 
      ...local, 
      canvas_w: screenW, 
      canvas_h: screenH,
      grid_cols: bestCols,
      grid_rows: bestRows
    });
  };

  return (
    <div className="pref-panel">
      <h3 className="pref-title">Settings</h3>

      <div className="pref-group">
        <label className="pref-label">Time range</label>
        <div className="pill-group">
          {TIME_RANGES.map(t => (
            <button key={t.value}
              className={`pill ${local.time_range === t.value ? 'active' : ''}`}
              onClick={() => set('time_range', t.value)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="pref-group">
        <label className="pref-label">Grid size 
          <span style={{float: 'right', fontWeight: 'normal', color: 'var(--text-dim)'}}>
            {local.grid_cols} × {local.grid_rows}
          </span>
        </label>
        
        {/* Auto-detect button moved inside the Grid size section */}
        <button 
          onClick={autoDetectLayout} 
          style={{
            width: '100%',
            background: 'var(--surface-2)',
            color: 'var(--text)',
            border: '1px solid var(--border-warm)',
            padding: '8px 12px',
            borderRadius: 'var(--radius)',
            cursor: 'pointer',
            fontSize: '12px',
            transition: 'background 0.2s',
            marginBottom: '0.75rem' // Space between button and pills
          }}
          onMouseOver={(e) => e.target.style.background = 'var(--surface-3)'}
          onMouseOut={(e) => e.target.style.background = 'var(--surface-2)'}
        >
          ✨ Auto-detect optimal layout
        </button>

        <div className="pill-group">
          {GRIDS.map(g => (
            <button key={g.label}
              className={`pill ${local.grid_cols === g.cols && local.grid_rows === g.rows ? 'active' : ''}`}
              onClick={() => handleGridChange(g.cols, g.rows)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pref-group">
        <label className="pref-label">Gap between covers</label>
        <div className="pill-group">
          {GAPS.map(g => (
            <button key={g.value}
              className={`pill ${local.gap_px === g.value ? 'active' : ''}`}
              onClick={() => set('gap_px', g.value)}>
              {g.label}
            </button>
          ))}
        </div>
      </div>

      <div className="pref-group">
        <label className="pref-label">Auto-refresh interval</label>
        <div className="pill-group">
          {INTERVALS.map(i => (
            <button key={i.value}
              className={`pill ${local.refresh_hrs === i.value ? 'active' : ''}`}
              onClick={() => set('refresh_hrs', i.value)}>
              {i.label}
            </button>
          ))}
        </div>
      </div>

      {/* Shuffle button in sidebar */}
      <div className="pref-group" style={{ marginTop: '0.5rem' }}>
        <label className="pref-label">Layout</label>
        <button className="btn-shuffle-sidebar" onClick={onShuffle}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Shuffle order
        </button>
      </div>
    </div>
  );
}