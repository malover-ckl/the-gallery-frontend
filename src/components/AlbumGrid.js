import React, { useRef, useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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

function getPopoverStyle(i, cols, rows) {
  const col = i % cols;
  const row = Math.floor(i / cols);
  const isBottomRow = row >= rows - 2;
  const vertical = isBottomRow
    ? { bottom: 'calc(100% + 8px)', top: 'auto' }
    : { top: 'calc(100% + 8px)', bottom: 'auto' };

  let shiftPercent = 50;
  if (col === 0) shiftPercent = 12;
  else if (col === 1 && cols > 4) shiftPercent = 25;
  else if (col === cols - 2 && cols > 4) shiftPercent = 75;
  else if (col === cols - 1) shiftPercent = 88;

  return {
    ...vertical,
    left: '50%',
    transform: `translateX(-${shiftPercent}%)`,
    '--arrow-x': `${shiftPercent}%`
  };
}

function getPopoverClass(i, cols, rows) {
  const row = Math.floor(i / cols);
  const isBottomRow = row >= rows - 2;
  return `replace-popover arrow-${isBottomRow ? 'bottom' : 'top'}`;
}

function SortableAlbumCell({
  id, album, index, isReplacing, onReplaceClick, 
  popoverProps, cols, rows
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`album-cell ${isReplacing ? ' replacing' : ''}`}
      title={album ? `${album.artist} — ${album.name}` : ''}
      {...attributes}
      {...listeners}
    >
      {album ? (
        <img src={album.url} alt={album.name} loading="lazy" draggable={false} />
      ) : (
        <div className="album-empty" />
      )}
      
      {index < 10 && album && <span className="album-rank">#{index + 1}</span>}
      
      <div className="album-overlay">
        <div
          className="album-overlay-icon"
          onPointerDown={(e) => {
            e.stopPropagation(); 
            onReplaceClick(index);
          }}
          title="Replace this album"
        >
          <ReplaceIcon />
        </div>
      </div>

      {isReplacing && (
        <div
          className={getPopoverClass(index, cols, rows)}
          style={getPopoverStyle(index, cols, rows)}
          onPointerDown={e => e.stopPropagation()}
        >
          {popoverProps.children}
        </div>
      )}
    </div>
  );
}

export default function AlbumGrid({
  albums, cols, rows, gap, onReorder, onReplace, replaceIndex,
  searchQuery, searchResults, searching, onSearchInput, onPick, onCloseReplace
}) {
  const total = cols * rows;
  const items = Array.from({ length: total }, (_, i) => ({
    id: albums[i]?.id || `slot-${i}`,
    album: albums[i] || null,
    originalIndex: i
  }));

  const [activeId, setActiveId] = useState(null);
  const containerRef = useRef(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);
      
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems.map(item => item.album));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (replaceIndex !== null && containerRef.current && !containerRef.current.contains(e.target)) {
        onCloseReplace();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [replaceIndex, onCloseReplace]);

  const activeItem = items.find(item => item.id === activeId);

  return (
    <div className="album-grid-wrap" ref={containerRef}>
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className={`album-grid ${replaceIndex !== null ? 'has-active-popover' : ''}`}
          style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: `${gap}px` }}
        >
          <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
            {items.map((item, i) => (
              <SortableAlbumCell
                key={item.id}
                id={item.id}
                album={item.album}
                index={i}
                cols={cols}
                rows={rows}
                isReplacing={replaceIndex === i}
                onReplaceClick={onReplace}
                popoverProps={{
                  children: (
                    <>
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
                        {searching && <div className="popover-status">Searching...</div>}
                        {!searching && !searchQuery && <div className="popover-status">Start typing to search Spotify</div>}
                        {!searching && searchQuery && searchResults.length === 0 && <div className="popover-status">No results found</div>}
                        {!searching && searchResults.map((resultAlbum, j) => (
                          <div key={j} className="popover-result" onClick={() => onPick(resultAlbum)}>
                            <img src={resultAlbum.url} alt={resultAlbum.name} />
                            <div className="popover-result-info">
                              <span className="popover-result-name">{resultAlbum.name}</span>
                              <span className="popover-result-artist">{resultAlbum.artist}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                }}
              />
            ))}
          </SortableContext>
        </div>
        
        <DragOverlay>
          {activeItem ? (
            <div className="album-cell" style={{ transform: 'scale(1.05)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
               {activeItem.album ? <img src={activeItem.album.url} alt="" /> : <div className="album-empty" />}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="grid-footer">
        <p className="grid-note">
          {albums.length} of {total} slots · drag to reorder · click icon to replace
        </p>
      </div>
    </div>
  );
}