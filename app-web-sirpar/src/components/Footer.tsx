export interface FooterProps {
  companyName?: string;
  year?: number;
}

export function Footer({
  companyName = 'SIRPAR',
  year = new Date().getFullYear()
}: FooterProps) {
  return (
    <footer style={{
      backgroundColor: '#111827',
      color: '#f3f4f6',
      padding: '3rem 2rem 2rem',
      borderTop: '1px solid #374151'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div>
          <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Acerca de</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Nosotros</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Misión</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Visión</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Servicios</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Reportes</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Monitoreo</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Alertas</a></li>
          </ul>
        </div>
        <div>
          <h4 style={{ marginBottom: '1rem', fontWeight: 'bold' }}>Legal</h4>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Privacidad</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Términos</a></li>
            <li><a href="#" style={{ color: '#d1d5db', textDecoration: 'none' }}>Contacto</a></li>
          </ul>
        </div>
      </div>
      <div style={{
        borderTop: '1px solid #374151',
        paddingTop: '2rem',
        textAlign: 'center',
        color: '#9ca3af'
      }}>
        <p style={{ margin: 0 }}>
          &copy; {year} {companyName}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
