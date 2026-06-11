import { useState } from 'react';

export default function Navbar({ view, setView, setActiveModuleId, isMobile }) {
  const [isAboutHovered, setIsAboutHovered] = useState(false);

  return (
    <header style={{
      ...navHeaderStyle,
      padding: isMobile ? '10px 15px' : '12px 40px'
    }}>
      <button
        onClick={() => { setView('home'); setActiveModuleId(null); }}
        style={{
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontWeight: 'bold', fontSize: isMobile ? '0.9rem' : '1.2rem', color: '#1e5631'
        }}
      >
        Climate Academy
      </button>

      <nav style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
        <button
          onClick={() => { setView('quizzes'); setActiveModuleId(null); }}
          style={{ ...navLinkStyle(view === 'quizzes'), fontSize: isMobile ? '0.85rem' : '1rem', padding: '8px 5px' }}
        >
          Quizzes
        </button>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setIsAboutHovered(!isAboutHovered)}
            style={{ ...navLinkStyle(view === 'mission' || view === 'team'), fontSize: isMobile ? '0.85rem' : '1rem', padding: '8px 5px' }}
          >
            About ▼
          </button>

          {isAboutHovered && (
            <div style={{
              ...dropdownMenuStyle,
              position: 'absolute', top: '100%', left: isMobile ? 'auto' : '0',
              right: isMobile ? '20px' : 'auto', marginTop: '5px'
            }}>
              <button
                onClick={() => { setView('mission'); setActiveModuleId(null); setIsAboutHovered(false); }}
                style={dropdownItemStyle}
              >
                Our Mission
              </button>
              <button
                onClick={() => { setView('team'); setActiveModuleId(null); setIsAboutHovered(false); }}
                style={dropdownItemStyle}
              >
                Meet Our Team
              </button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}

const navHeaderStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  backgroundColor: '#ffffff',
  borderBottom: '1px solid #e0e0e0',
  boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  zIndex: 1000,
  boxSizing: 'border-box'
};

const navLinkStyle = (isActive) => ({
  background: 'none',
  border: 'none',
  borderBottom: isActive ? '2px solid #1e5631' : '2px solid transparent',
  color: isActive ? '#1e5631' : '#555',
  fontWeight: isActive ? 'bold' : 'normal',
  cursor: 'pointer',
  padding: '8px 12px',
  fontSize: '1rem'
});

const dropdownMenuStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '4px',
  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
  display: 'flex',
  flexDirection: 'column',
  minWidth: '120px',
  zIndex: 1000,
  overflow: 'hidden'
};

const dropdownItemStyle = {
  background: 'none',
  border: 'none',
  padding: '12px 16px',
  textAlign: 'left',
  cursor: 'pointer',
  fontSize: '0.95rem',
  color: '#555',
  borderBottom: '1px solid #eee',
  width: '100%'
};