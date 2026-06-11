import { TEAM_MEMBERS } from '../teamData';

export default function TeamView({ isMobile }) {
  return (
    <div style={{ padding: isMobile ? '20px' : '40px' }}>
      <h2 style={{ color: '#1e5631', marginTop: 0, marginBottom: '40px' }}>Meet the team</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {TEAM_MEMBERS.map((member) => (
          <div key={member.id} style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'center' : 'flex-start',
            gap: '30px',
            paddingBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: isMobile ? '100%' : '200px',
              flexShrink: 0
            }}>
              <img src={`${import.meta.env.BASE_URL}${member.photo}`} alt={member.name} style={{ width: '150px', height: '150px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1e5631' }} />
              <h3 style={{ margin: '15px 0 5px 0', color: '#222', textAlign: 'center' }}>{member.name}</h3>
              <p style={{ margin: 0, color: '#1e5631', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center' }}>{member.role}</p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, color: '#555', fontSize: '1rem', lineHeight: '1.6', textAlign: 'justify' }}>{member.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}