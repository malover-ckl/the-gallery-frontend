import React from 'react';
import './AlbumGrid.css';

export default function AlbumGrid({ albums, cols, rows, gap }) {
  const total = cols * rows;
  const cells = Array.from({ length: total }, (_, i) => albums[i] || null);

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
          <div key={i} className="album-cell" title={album ? `${album.artist} — ${album.name}` : ''}>
            {album
              ? <img src={album.url} alt={album.name} loading="lazy" />
              : <div className="album-empty" />
            }
            {i < 10 && album && (
              <span className="album-rank">#{i + 1}</span>
            )}
          </div>
        ))}
      </div>
      <p className="grid-note">{albums.length} of {total} slots filled</p>
    </div>
  );
}
