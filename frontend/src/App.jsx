// src/App.jsx
import { useState } from 'react';
import axios from 'axios';
import './App.css';   // Importa los estilos

function App() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mensaje, setMensaje] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data } = await axios.post('http://localhost:3001/login', { email, password });
      setMensaje('Login exitoso. Token: ' + data.token);
    } catch (err) {
      setMensaje('Error: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
       <img src="/emser.png" alt="Emser Logo" />
        <h2>Inicia Sesiòn en tu cuenta</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email">Correo Electrònico</label>
            <input
              className='login-input' id="email" type="email" required
              value={email} onChange={e => setEmail(e.target.value)} placeholder='Correo Electrònico'
            />
          </div>

          <div>
            <label htmlFor="password">Contraseña</label>
            <input
              className='login-input' id="password" type="password" required
              value={password} onChange={e => setPassword(e.target.value)} placeholder='Contraseña'
            />
            
          </div>

          <button type="submit" className="btn">Iniciar Sesiòn</button>
        </form>

        {mensaje && (
          <p style={{ marginTop: '1rem', color: mensaje.startsWith('Error') ? '#b91c1c' : '#047857' }}>
            {mensaje}
          </p>
        )}

        
      </div>
    </div>
  );
}

export default App;
