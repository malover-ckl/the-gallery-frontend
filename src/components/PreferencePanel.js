import React, { useState, useRef, useEffect } from 'react';
import { GRIDS } from '../gridOptions';
import './PreferencePanel.css';

const TIME_RANGES = [
  { value: 'short_term',  label: 'Recent (~4 weeks)' },
  { value: 'medium_term', label: 'Recent months (~6 months)' },
  { value: 'long_term',   label: 'All-time favorites' },
];

const GAPS = [
  { value: 0,  label: 'None' },
  { value: 3,  label: 'Tiny' },
  { value: 6,  label: 'Small' },
];

const INTERVALS = [
  { value: 168,  label: 'Weekly' },
  { value: 730,  label: 'Monthly' },
  { value: 2190, label: 'Every 3 months' },
  { value: 4380, label: 'Every 6 months' },
  { value: 8760, label: 'Yearly' },
];

// Reusable custom dropdown. Styled to match the app's existing pill aesthetic
// (rounded, bordered, using the same --surface-2 / --border-warm variables
// the sidebar buttons already use). Closes on outside click or Escape.
function Dropdown({ label, options, activeValue, getKey, getLabel, onSelect }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const activeOption = options.find(o => getKey(o) === activeValue);

  return (
    <div className="pref-dropdown" ref={ref}>
      <button
        type="button"
        className={`pref-dropdown-trigger ${open ? 'open' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{activeOption ? getLabel(activeOption) : label}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`pref-dropdown-chevron ${open ? 'open' : ''}`}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <ul className="pref-dropdown-menu" role="listbox">
          {options.map(opt => {
            const key = getKey(opt);
            const isActive = key === activeValue;
            return (
              <li key={key}>
                <button
                  type="button"
                  className={`pref-dropdown-option ${isActive ? 'active' : ''}`}
                  role="option"
                  aria-selected={isActive}
                  onClick={() => { onSelect(opt); setOpen(false); }}
                >
                  {getLabel(opt)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function PreferencePanel({ prefs, onSave, saved, onShuffle, onColorBalance, colorBalancing, isCustom }) {
  // Every selection now saves immediately instead of staging changes
  // locally and waiting for an "Apply" button. `prefs` is the live source
  // of truth from Dashboard; we just merge in the one changed field and
  // hand the whole object back to onSave.
  const update = (changes) => onSave({ ...prefs, ...changes });

  return (
    <div className="pref-panel">
      <h3 className="pref-title">Settings</h3>

      <div className="pref-group">
        <label className="pref-label">Time range</label>
        <Dropdown
          label="Select time range"
          options={TIME_RANGES}
          activeValue={prefs.time_range}
          getKey={t => t.value}
          getLabel={t => t.label}
          onSelect={t => update({ time_range: t.value })}
        />
      </div>

      <div className="pref-group">
        <label className="pref-label">Grid size</label>
        <Dropdown
          label="Select grid size"
          options={GRIDS}
          activeValue={`${prefs.grid_cols}x${prefs.grid_rows}`}
          getKey={g => `${g.cols}x${g.rows}`}
          getLabel={g => g.label}
          onSelect={g => update({ grid_cols: g.cols, grid_rows: g.rows })}
        />
      </div>

      <div className="pref-group">
        <label className="pref-label">Gap between covers</label>
        <Dropdown
          label="Select gap"
          options={GAPS}
          activeValue={prefs.gap_px}
          getKey={g => g.value}
          getLabel={g => g.label}
          onSelect={g => update({ gap_px: g.value })}
        />
      </div>

      <div className="pref-group">
        <label className="pref-label">Auto-refresh interval</label>
        <Dropdown
          label="Select interval"
          options={INTERVALS}
          activeValue={prefs.refresh_hrs}
          getKey={i => i.value}
          getLabel={i => i.label}
          onSelect={i => update({ refresh_hrs: i.value })}
        />
      </div>

      {saved && <p className="pref-saved-note">✓ Saved</p>}

      {/* Layout buttons in sidebar */}
      <div className="pref-group pref-group--layout">
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