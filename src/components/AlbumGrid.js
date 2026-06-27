import React, { useState } from 'react';
import './AlbumGrid.css';

export default function AlbumGrid({ albums, cols, rows, gap, onReorder, onReplace }) {
  const total = cols * rows;
  const cells = Array.from({ length: total }, (_, i) => albums[i] || null);
  const [selected, setSelected] = useState(null);

  const handleClick = (i) => {
    if (selected === null) {
      setSelected(i);
    } else if (selected === i) {
      setSelected(null);
    } else {
      const newAlbums = [...albums];
      const temp = newAlbums[selected];
      newAlbums[selected] = newAlbums[i];
      newAlbums[i] = temp;
      onReorder(newAlbums);
      setSelected(null);
    }
  };

  return (
    <div className="album-grid-wrap">
      {selected !== null && (
        <p className="grid-hint">Now click another album to swap it with #{selected + 1}</p>
      )}
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
            className={`album-cell ${selected === i ? 'selected' : ''}`}
            title={album ? `${album.artist} — ${album.name}` : ''}
          >
            {album
              ? <img src={album.url} alt={album.name} loading="lazy" />
              : <div className="album-empty" />
            }
            {i < 10 && album && (
              <span className="album-rank">#{i + 1}</span>
            )}
            <div className="album-actions">
              <button className="btn-move" onClick={() => handleClick(i)}>
                {selected === i ? '✓ Selected' : '⇄ Move'}
              </button>
              <button className="btn-replace" onClick={() => onReplace(i)}>
                ⊕ Replace
              </button>
            </div>
          </div>
        ))}
      </div>
      <p className="grid-note">{albums.length} of {total} slots filled</p>
    </div>
  );
}