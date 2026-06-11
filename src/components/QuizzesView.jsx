export default function QuizzesView({ modules, refreshKey, onStartModule, onResetModule }) {
  return (
    <div>
      <h2 style={{ color: '#1e5631', marginTop: 0 }}>Course Library</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {modules.map((module) => {
          const isFinal = localStorage.getItem(`lms_final_${module.id}`) === 'true';
          const savedData = localStorage.getItem(`lms_options_${module.id}`);
          const hasStarted = savedData && Object.keys(JSON.parse(savedData)).length > 0;

          return (
            <div key={`${module.id}-${refreshKey}`} style={{
              ...cardStyle,
              maxWidth: '1000px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
              alignItems: window.innerWidth <= 768 ? 'stretch' : 'center',
              justifyContent: 'space-between',
              gap: window.innerWidth <= 768 ? '15px' : '20px',
              marginBottom: 0
            }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0', color: '#222' }}>{module.title}</h3>
                <p style={{ margin: '0 0 10px 0', color: '#666', fontSize: '0.95rem' }}>{module.description}</p>
                {isFinal ? (
                  <span style={{ color: '#1e5631', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Completed</span>
                ) : hasStarted ? (
                  <span style={{ color: '#d97706', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱ In Progress</span>
                ) : (
                  <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 'bold' }}>○ Not Started</span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: window.innerWidth <= 768 ? 'flex-start' : 'flex-end' }}>
                <button onClick={() => onStartModule(module.id)} style={{ ...primaryBtnStyle, flex: window.innerWidth <= 768 ? 1 : 'none', textAlign: 'center' }}>
                  {isFinal ? 'View Results' : hasStarted ? 'Resume' : 'Start'}
                </button>
                {hasStarted && (
                  <button onClick={() => onResetModule(module.id)} style={resetOutlineBtnStyle}>Reset</button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '6px',
  padding: '24px',
  marginBottom: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
  boxSizing: 'border-box'
};

const primaryBtnStyle = {
  padding: '10px 20px',
  backgroundColor: '#1e5631',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontWeight: '500',
  fontSize: '0.95rem',
  transition: 'background-color 0.2s',
  boxSizing: 'border-box'
};

const resetOutlineBtnStyle = {
  padding: '8px 12px',
  color: '#d32f2f',
  border: '1px solid #d32f2f',
  backgroundColor: 'transparent',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '0.9rem'
};