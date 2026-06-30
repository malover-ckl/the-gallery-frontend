import React, { useState } from 'react';
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

const RESOLUTIONS = [
  { w: 1920, h: 1080,  label: '1920 × 1080' },
  { w: 1920, h: 1200,  label: '1920 × 1200' },
  { w: 2560, h: 1440,  label: '2560 × 1440' },
  { w: 3840, h: 2160,  label: '3840 × 2160' },
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

export default function PreferencePanel({ prefs, onSave, saved, onShuffle, onColorBalance, colorBalancing, isCustom }) {
  const [local, setLocal] = useState({ ...prefs });

  const set = (key, val) => setLocal(p => ({ ...p, [key]: val }));

  const handleGridChange = (cols, rows) => {
    setLocal(p => ({ ...p, grid_cols: cols, grid_rows: rows }));
  };

  const handleResChange = (w, h) => {
    setLocal(p => ({ ...p, canvas_w: w, canvas_h: h }));
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
        <label className="pref-label">Grid size</label>
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
        <label className="pref-label">Resolution</label>
        <div className="pill-group">
          {RESOLUTIONS.map(r => (
            <button key={r.label}
              className={`pill ${local.canvas_w === r.w && local.canvas_h === r.h ? 'active' : ''}`}
              onClick={() => handleResChange(r.w, r.h)}>
              {r.label}
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

      <button className="btn-save" onClick={() => onSave(local)}>
        {saved ? '✓ Saved' : 'Apply & preview'}
      </button>

      {/* Layout buttons in sidebar */}
      <div className="pref-group" style={{ marginTop: '0.5rem' }}>
        <label className="pref-label">Layout</label>
        
        <div style={{ display: 'flex', gap: '8px', flexDirection: 'column' }}>
          <button className="btn-shuffle-sidebar" onClick={onShuffle}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}>
              <polyline points="16 3 21 3 21 8"/>
              <line x1="4" y1="20" x2="21" y2="3"/>
              <polyline points="21 16 21 21 16 21"/>
              <line x1="15" y1="15" x2="21" y2="21"/>
            </svg>
            Shuffle order
          </button>

          <button 
            className="btn-shuffle-sidebar" 
            onClick={onColorBalance}
            disabled={colorBalancing}
            style={{ background: 'var(--surface-2)', border: '1px solid var(--border-warm)', opacity: colorBalancing ? 0.6 : 1, cursor: colorBalancing ? 'default' : 'pointer' }}
          >
            🎨 {colorBalancing ? 'Balancing...' : 'Balance colors'}
          </button>
        </div>
      </div>
    </div>
  );
}