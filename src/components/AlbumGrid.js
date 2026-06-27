import React, { useState, useRef } from 'react';
import './AlbumGrid.css';

export default function AlbumGrid({ albums, cols, rows, gap, onReorder, onReplace }) {
  const total = cols * rows;
  const cells = Array.from({ length: total }, (_, i) => albums[i] || null);

  const dragIndex = useRef(null);
  const [dragOver, setDragOver] = useState(null);

  const handleDragStart = (i) => {
    dragIndex.current = i;
  };

  const handleDragOver = (e, i) => {
    e.preventDefault();
    setDragOver(i);
  };

  const handleDrop = (e, i) => {
    e.preventDefault();
    setDragOver(null);
    if (dragIndex.current === null || dragIndex.current === i) return;
    const newAlbums = [...albums];
    const dragged = newAlbums[dragIndex.current];
    newAlbums.splice(dragIndex.current, 1);
    newAlbums.splice(i, 0, dragged);
    dragIndex.current = null;
    onReorder(newAlbums);
  };

  const handleDragEnd = () => {
    setDragOver(null);
    dragIndex.current = null;
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
            className={`album-cell ${dragOver === i ? 'drag-over' : ''}`}
            title={album ? `${album.artist} — ${album.name}` : ''}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={(e) => handleDrop(e, i)}
            onDragEnd={handleDragEnd}
            onClick={() => onReplace(i)}
          >
            {album
              ? <img src={album.url} alt={album.name} loading="lazy" draggable={false} />
              : <div className="album-empty" />
            }
            {i < 10 && album && (
              <span className="album-rank">#{i + 1}</span>
            )}
            <div className="album-overlay">
              <span className="album-overlay-text">Replace</span>
            </div>
          </div>
        ))}
      </div>
      <p className="grid-note">{albums.length} of {total} slots filled · Drag to reorder · Click to replace</p>
    </div>
  );
}