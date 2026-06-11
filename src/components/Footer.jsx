export default function Footer({ isMobile }) {
  return (
    <footer style={{
      backgroundColor: '#f5f0e6',
      padding: '40px 20px',
      borderTop: '1px solid #e0e0e0'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: '40px',
        justifyContent: 'space-between'
      }}>
        {/* Feedback card */}
        <div style={{ flex: 1, backgroundColor: '#f97316', padding: '20px', borderRadius: '8px', color: '#fff', textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 10px 0' }}>Contact Us</h3>
          <p style={{ fontSize: '0.9rem', marginBottom: '15px', opacity: '0.9' }}>Send us your feedback or questions.</p>
          <input type="text" placeholder="Name" style={{ width: '80%', marginBottom: '10px', padding: '8px', backgroundColor: '#fff', border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto', color: '#000' }} />
          <input type="email" placeholder="Email" style={{ width: '80%', marginBottom: '10px', padding: '8px', backgroundColor: '#fff', border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto', color: '#000' }} />
          <textarea placeholder="Message" style={{ width: '80%', height: '80px', marginBottom: '10px', padding: '8px', backgroundColor: '#fff', border: 'none', borderRadius: '4px', display: 'block', margin: '0 auto 10px auto' }} />
          <button style={{ width: '80%', padding: '10px', backgroundColor: '#fff', color: '#f97316', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer', display: 'block', margin: '0 auto' }}>Send Message</button>
        </div>

        {/* Collaborator 1 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="teamphotos/ZS.jpeg" alt="Zeshan Foundation" style={{ width: '180px', height: '90px', objectFit: 'contain', backgroundColor: '#fff', margin: '0 auto 10px auto' }} />
          <h4 style={{ margin: '0 0 5px 0' }}>CarbonCare InnoLab</h4>
          <p style={{ fontSize: '0.85rem', color: '#555' }}>In Association with.</p>
        </div>

        {/* Collaborator 2 */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <img src="teamphotos/CCIL.jpeg" alt="CarbonCare InnoLab" style={{ width: '180px', height: '90px', objectFit: 'contain', backgroundColor: '#fff', margin: '0 auto 10px auto' }} />
          <h4 style={{ margin: '0 0 5px 0' }}>CarbonCare InnoLab</h4>
          <p style={{ fontSize: '0.85rem', color: '#555' }}>In Association with.</p>
        </div>
      </div>
    </footer>
  );
}