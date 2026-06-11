export default function MissionView({ isMobile }) {
  return (
    <div style={{ width: '100%', marginTop: isMobile ? '-50px' : '-65px' }}>
      {/* Hero with background image */}
      <div style={{
        width: '100%',
        height: '400px',
        backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("random/test_random.jpeg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        textAlign: 'center',
        padding: '20px',
        boxSizing: 'border-box'
      }}>
        <h1 style={{ fontSize: '3rem', margin: '0 0 20px 0' }}>Our Mission</h1>
        <p style={{ fontSize: '1.2rem', maxWidth: '700px', textAlign: 'justify' }}>
          Make climate education accessible — to advance inclusive climate education through multidisciplinary learning which supports youth to develop informed perspective on local climate issues
        </p>
      </div>

      {/* Who We Are */}
      <div style={{ backgroundColor: '#fff8e7', width: '100%', padding: '60px 20px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#1e5631', marginBottom: '20px' }}>Who Are We?</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#4a4a4a', textAlign: 'justify' }}>
            We are a youth-led organization consists of climate professionals and COP youth delegates,
            which aims to translate expert knowledge into accessible information to inspire and empower young people with the tools and perspectives to shape a just and sustainable future.
          </p>
        </div>
      </div>

      {/* What We Do */}
      <div style={{ backgroundColor: '#cfe9d4', width: '100%', padding: '60px 20px', boxSizing: 'border-box' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ color: '#1e5631', marginBottom: '20px' }}>What We Do?</h2>
          <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#4a4a4a' }}>
            We provide free bilingual online courses on multidisciplinary knowledge on climate change, including law, policy and finance.
          </p>
        </div>
      </div>
    </div>
  );
}