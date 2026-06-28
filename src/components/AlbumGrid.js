import React, { useRef, useState } from 'react';
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

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function AlbumGrid({ albums, cols, rows, gap, onReorder, onReplace }) {
  const total     = cols * rows;
  const cells     = Array.from({ length: total }, (_, i) => albums[i] || null);
  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

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

  const handleShuffle = () => {
    onReorder(shuffle(albums));
  };

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
            className={`album-cell${dragOver === i ? ' drag-over' : ''}`}
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
          </div>
        ))}
      </div>
      <div className="grid-footer">
        <p className="grid-note">
          {albums.length} of {total} slots · drag to reorder · click icon to replace
        </p>
        <button className="btn-shuffle" onClick={handleShuffle} title="Shuffle order">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 3 21 3 21 8"/>
            <line x1="4" y1="20" x2="21" y2="3"/>
            <polyline points="21 16 21 21 16 21"/>
            <line x1="15" y1="15" x2="21" y2="21"/>
          </svg>
          Shuffle
        </button>
      </div>
    </div>
  );
}