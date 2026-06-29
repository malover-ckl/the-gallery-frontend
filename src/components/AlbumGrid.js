import React, { useRef, useState, useEffect } from 'react';
import './AlbumGrid.css';

function ReplaceIcon() {
  return (
    <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 8a6 6 0 1 0 6-6" />
      <path d="M5 2L2 5l3 3" />
      <path d="M8 5v3l2 2" />
    </svg>
  );
}

export default function AlbumGrid({ albums, cols, rows, gap, onReorder, onReplace, replaceIndex, searchQuery, searchResults, searching, onSearchInput, onPick, onCloseReplace }) {
  const total     = cols * rows;
  const cells     = Array.from({ length: total }, (_, i) => albums[i] || null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);
  const cellRefs  = useRef([]);
  const popoverRef = useRef(null);

  const handleDragStart = (e, i) => {
    dragIndex.current = i;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOver !== i) setDragOver(i);
  };

  const handleDrop = (e, i) => {
    e.preventDefault();
    setDragOver(null);
    if (dragIndex.current === null || dragIndex.current === i) return;
    const newAlbums = [...albums];
    const from = dragIndex.current;
    [newAlbums[from], newAlbums[i]] = [newAlbums[i], newAlbums[from]];
    dragIndex.current = null;
    onReorder(newAlbums);
  };

  const handleDragEnd = () => {
    setDragOver(null);
    dragIndex.current = null;
  };

  const handleReplaceClick = (e, i) => {
    e.stopPropagation();
    onReplace(i);
  };

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target) &&
          cellRefs.current[replaceIndex] && !cellRefs.current[replaceIndex].contains(e.target)) {
        onCloseReplace();
      }
    };
    if (replaceIndex !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [replaceIndex, onCloseReplace]);

  return (
    <div className="album-grid-wrap">
      <div
        className="album-grid"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: `${gap}px`,
        }}
      >
        {cells.map((album, i) => (
          <div
            key={i}
            ref={el => cellRefs.current[i] = el}
            className={`album-cell${dragOver === i ? ' drag-over' : ''}${replaceIndex === i ? ' replacing' : ''}`}
            title={album ? `${album.artist} — ${album.name}` : ''}
            draggable
            onDragStart={(e) => handleDragStart(e, i)}
            onDragOver={(e)  => handleDragOver(e, i)}
            onDrop={(e)      => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
          >
            {album
              ? <img src={album.url} alt={album.name} loading="lazy" draggable={false} />
              : <div className="album-empty" />
            }
            {i < 10 && album && (
              <span className="album-rank">#{i + 1}</span>
            )}
            <div className="album-overlay">
              <div
                className="album-overlay-icon"
                onClick={(e) => handleReplaceClick(e, i)}
                title="Replace this album"
              >
                <ReplaceIcon />
              </div>
            </div>

            {/* Popover attached below this cell */}
            {replaceIndex === i && (
              <div className="replace-popover" ref={popoverRef} onClick={e => e.stopPropagation()}>
                <div className="popover-search">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Search albums..."
                    value={searchQuery}
                    onChange={onSearchInput}
                    className="popover-input"
                  />
                  <button className="popover-close" onClick={onCloseReplace}>✕</button>
                </div>
                <div className="popover-results">
                  {searching && (
                    <div className="popover-status">Searching...</div>
                  )}
                  {!searching && !searchQuery && (
                    <div className="popover-status">Start typing to search Spotify</div>
                  )}
                  {!searching && searchQuery && searchResults.length === 0 && (
                    <div className="popover-status">No results found</div>
                  )}
                  {!searching && searchResults.map((album, j) => (
                    <div key={j} className="popover-result" onClick={() => onPick(album)}>
                      <img src={album.url} alt={album.name} />
                      <div className="popover-result-info">
                        <span className="popover-result-name">{album.name}</span>
                        <span className="popover-result-artist">{album.artist}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid-footer">
        <p className="grid-note">
          {albums.length} of {total} slots · drag to reorder · click icon to replace
        </p>
      </div>
    </div>
  );
}
