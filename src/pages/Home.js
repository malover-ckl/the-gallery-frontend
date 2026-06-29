import React from 'react';
import './Home.css';

const API = process.env.REACT_APP_API_URL || '';

const MOSAIC_COLORS = [
'#ffd166', '#ffb5a7', '#ef6c9f', '#9da9df', '#a8dadc', 
'#a8dadc', '#ef6c9f', '#ffd166', '#06d6a0', '#9da9df',
'#06d6a0', '#ffd166', '#9da9df', '#a8dadc', '#ef6c9f', 
'#ef6c9f', '#9da9df', '#a8dadc', '#ffd166', '#06d6a0',
'#9da9df', '#06d6a0', '#ef6c9f', '#ffd166', '#a8dadc',
'#ffd166', '#a8dadc', '#06d6a0', '#9da9df', '#ef6c9f'
];

export default function Home() {
  return (
    <div className="home">
      <nav className="nav">
        <span className="nav-logo">The Gallery</span>
        <a href={`${API}/auth/login`} className="nav-cta">
          Connect with Spotify
        </a>
      </nav>

      <main className="hero">
        <div className="hero-text">
          <p className="hero-eyebrow">Your music. On display.</p>
          <h1 className="hero-headline">
            The wallpaper that knows<br />
            <em>what you've been<br />listening to.</em>
          </h1>
          <p className="hero-body">
            The Gallery pulls your Spotify top albums and turns them into a
            stunning mosaic wallpaper — curated by your taste, updated as it evolves.
          </p>
          <a href={`${API}/auth/login`} className="btn-connect">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
            Connect with Spotify
          </a>
          <p className="hero-fine">Free. No credit card. Read-only Spotify access.</p>
        </div>

        <div className="hero-visual">
          <div className="mosaic-glow" />
          <div className="hero-mosaic">
            {MOSAIC_COLORS.map((color, i) => (
              <div
                key={i}
                className="mosaic-cell"
                style={{
                  background: color,
                  animationDelay: `${i * 0.06}s`,
                }}
              />
            ))}
          </div>
        </div>
      </main>

      <section className="how">
        <div className="how-inner">
          <div className="how-step">
            <span className="how-num">01</span>
            <h3>Connect Spotify</h3>
            <p>Log in and grant read access to your top tracks. We only read — never write.</p>
          </div>
          <div className="how-step">
            <span className="how-num">02</span>
            <h3>Curate your grid</h3>
            <p>Drag to reorder, replace albums you don't want, and pick your layout and resolution.</p>
          </div>
          <div className="how-step">
            <span className="how-num">03</span>
            <h3>Set it and forget it</h3>
            <p>Install the companion app and your wallpaper refreshes automatically as your taste shifts.</p>
          </div>
        </div>
      </section>

      <footer className="footer">
        <span>The Gallery — not affiliated with Spotify</span>
      </footer>
    </div>
  );
}
