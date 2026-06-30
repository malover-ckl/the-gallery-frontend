import React from 'react';
import './CompanionDownload.css';

export default function CompanionDownload({ userId, apiUrl }) {
  return (
    <div className="companion">
      <h3 className="companion-title">Companion app</h3>
      <p className="companion-body">
        Runs in the background and updates your actual desktop wallpaper automatically — no manual downloads.
      </p>
      <div className="companion-btns">
        <a
          href="https://github.com/malover-ckl/the-gallery-backend/releases/download/v1.0/TheGallery.exe"
          className="companion-btn"
          download
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/></svg>
          Windows
        </a>
        <span className="companion-btn companion-btn-disabled" title="Mac support coming soon">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm3.562 7.314c.073.007.144.016.214.027-.234.43-.408.892-.504 1.38-.604-.57-1.057-1.26-1.057-2.102 0-.13.013-.257.037-.382.476.21.93.577 1.31 1.077zm-7.124 0c.38-.5.834-.867 1.31-1.077.024.125.037.252.037.382 0 .842-.453 1.532-1.057 2.102-.096-.488-.27-.95-.504-1.38.07-.011.141-.02.214-.027zM12 4.8c.552 0 1.08.09 1.575.255-.13.384-.2.79-.2 1.212 0 1.458.878 2.652 2.1 3.133-.02.2-.03.402-.03.607 0 3.18-1.993 5.88-3.445 7.193C10.548 15.887 8.555 13.187 8.555 10.007c0-.205-.01-.407-.03-.607 1.222-.481 2.1-1.675 2.1-3.133 0-.422-.07-.828-.2-1.212C10.92 4.89 11.448 4.8 12 4.8z"/></svg>
          Mac — soon
        </span>
      </div>
      <p className="companion-note">User ID embedded in installer — no setup needed.</p>
    </div>
  );
}
