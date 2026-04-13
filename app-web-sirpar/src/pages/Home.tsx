import { useState } from 'react';
import { Navbar } from '../components/Navbar';
import { HeroSection } from '../components/HeroSection';
import { CompromisoSection } from '../components/CompromisoSection';
import { NewReportesSection } from '../components/NewReportesSection';
import { CallActionSection } from '../components/CallActionSection';
import { Footer } from '../components/Footer';
import { LoginModal } from '../components/login';
import { RegisterModal } from '../components/register';

export function Home() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  const handleLoginClick = () => {
    setShowLogin(true);
    setShowRegister(false);
  };

  const handleSwitchToRegister = () => {
    setShowLogin(false);
    setShowRegister(true);
  };

  const handleSwitchToLogin = () => {
    setShowRegister(false);
    setShowLogin(true);
  };

  const handleCloseLogin = () => {
    setShowLogin(false);
  };

  const handleCloseRegister = () => {
    setShowRegister(false);
  };

  const handleHeroClick = () => {
    alert('¡Explorando SIRPAR!');
  };

  const handleReportarClick = () => {
    alert('Formulario de reporte abierto');
  };

  const handleMasInfoClick = () => {
    alert('Más información sobre SIRPAR');
  };

  const handleVerTodosReportes = () => {
    alert('Ir a vista de todos los reportes');
  };

  return (
    <div>
      <Navbar title="SIRPAR - Sistema Ambiental" onLoginClick={handleLoginClick} />
      <LoginModal isOpen={showLogin} onClose={handleCloseLogin} onSwitchToRegister={handleSwitchToRegister} />
      <RegisterModal isOpen={showRegister} onClose={handleCloseRegister} onSwitchToLogin={handleSwitchToLogin} />
      <HeroSection
        title="Bienvenido a SIRPAR"
        subtitle="Sistema Integral de Reportes Ambientales"
        ctaText="Explorar Ahora"
        onCtaClick={handleHeroClick}
      />
      <CompromisoSection />
      <NewReportesSection onVerTodos={handleVerTodosReportes} />
      <CallActionSection
        onPrimaryClick={handleReportarClick}
        onSecondaryClick={handleMasInfoClick}
      />
      <Footer companyName="SIRPAR" year={2024} />
    </div>
  );
}
