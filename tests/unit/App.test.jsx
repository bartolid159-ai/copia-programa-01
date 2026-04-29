import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, afterEach } from 'vitest';
import App from '../../src/App.jsx';

describe('App Component - Tarea 01', () => {
  afterEach(cleanup);

  it('debe renderizar el título de la aplicación y permitir navegar a Contabilidad', () => {
    render(<App />);
    expect(screen.getByText(/Médica/i)).toBeInTheDocument();
    
    // Al inicio debe cargar Pacientes (nuevo comportamiento)
    expect(screen.getByText(/Gestión de Pacientes/i)).toBeInTheDocument();

    // Buscamos y hacemos click en el módulo de Contabilidad en el sidebar
    const accountingSidebarLink = screen.getByText('Contabilidad');
    fireEvent.click(accountingSidebarLink);

    // Ahora verificamos que el header y el contenido cambien
    expect(screen.getByText(/Contabilidad \/ Dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/Panel de Inteligencia/i)).toBeInTheDocument();
  });

  it('debe iniciar en Modo Oscuro por defecto (sin la clase light-mode)', () => {
    render(<App />);
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });

  it('debe cambiar a Modo Claro al hacer click en el botón de toggle', () => {
    render(<App />);
    const toggleButton = screen.getByRole('button', { name: /Modo Claro/i });
    
    // Cambiar a Modo Claro
    fireEvent.click(toggleButton);
    expect(document.body.classList.contains('light-mode')).toBe(true);
    expect(screen.getByText(/🌙 Modo Oscuro/i)).toBeInTheDocument();

    // Regresar a Modo Oscuro
    fireEvent.click(screen.getByRole('button', { name: /Modo Oscuro/i }));
    expect(document.body.classList.contains('light-mode')).toBe(false);
    expect(screen.getByText(/☀️ Modo Claro/i)).toBeInTheDocument();
  });
});
