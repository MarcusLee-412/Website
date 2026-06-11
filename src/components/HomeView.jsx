export default function HomeView({ setView, isMobile }) {
  return (
    <div style={{ width: '100%', backgroundColor: '#fff' }}>
      {/* Hero Section */}
      <section style={{
        backgroundColor: '#f5f0e6',
        padding: isMobile ? '40px 20px' : '80px 40px',
        boxSizing: 'border-box'
      }}>
        <div style={{
          maxWidth: '1100px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: 'center',
          gap: '60px'
        }}>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: isMobile ? '2rem' : '2.5rem', margin: '0 0 20px 0', fontWeight: '800', lineHeight: '1.1', color: '#1a1a1a', textAlign: "left" }}>
              Master Climate Policy, Finance & Real-World Solutions
            </h1>
            <p style={{ fontSize: '1.1rem', lineHeight: '1.3', margin: '0 0 20px 0', color: '#4a4a4a', textAlign: 'left' }}>
              Structured courses to access for students/professionals with environment entities, interactive modules, quizzes, and certification.
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
              <button onClick={() => setView('quizzes')} style={primaryBtnStyle}>Start Learning</button>
              <button onClick={() => setView('quizzes')} style={{ ...resetOutlineBtnStyle, borderColor: '#333', color: '#333' }}>Explore Courses</button>
            </div>
            <div style={{ display: 'flex', gap: '40px', marginTop: '40px', justifyContent: 'center' }}>
              <div><div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>5</div><div style={{ fontSize: '0.9rem', color: '#333' }}>Courses</div></div>
              <div><div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>15+</div><div style={{ fontSize: '0.9rem', color: '#333' }}>Modules</div></div>
              <div><div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#1e5631' }}>100%</div><div style={{ fontSize: '0.9rem', color: '#333' }}>Free</div></div>
            </div>
          </div>
          <div style={{ height: isMobile? '300': '390px', width: isMobile? '400': '550px'}}>
            <img src="random/test_random.jpeg" alt="Climate Academy Classroom" style={{ width: '100%', height:"100%", objectFit: 'fill', display: 'block' }} />
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section style={{ padding: isMobile ? '40px 20px' : '80px 20px', backgroundColor: '#ffffff' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', color: '#222' }}>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.7', marginBottom: '20px', textAlign: "justify" }}>
            This platform provides bilingual modules, infographics, quizzes, and real-world case studies, you’ll see how climate connects to law, finance, policy, and everyday life. It’s built by youth for youth, to make climate literacy accessible and engaging. Together, the platform aims to break barriers and spark a generation ready to lead on climate action.
          </p>
        </div>
      </section>
    </div>
  );
}

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