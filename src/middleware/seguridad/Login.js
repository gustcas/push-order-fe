import React, { useEffect, useRef, useState } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Password } from 'primereact/password';
import { Toast } from 'primereact/toast';
import { metodoRest } from '../api/metodoRest';
import { AUTH_ENDPOINTS } from '../endpoint/ApiRestEndpoint';
import { observer } from 'mobx-react';
import { useDataStore } from '../../data/DataStoreContext';
import './styles.css';

function decodeJwtRole(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role || payload.roles?.[0] || payload.authorities?.[0] || null;
  } catch {
    return null;
  }
}

export const Login = observer(({ setIsLoggedIn }) => {
  const toast = useRef();
  const [valueUsuario, setValueUsuario] = useState('');
  const [valuePassword, setValuePassword] = useState('');
  const [loading, setLoading] = useState(false);
  const dataStore = useDataStore();

  useEffect(() => {
    setValuePassword('');
    setValueUsuario('');
  }, []);

  function showToast(tipo, titulo, mensaje) {
    toast.current.show({ severity: tipo, summary: titulo, detail: mensaje, life: 3000 });
  }

  async function validarLogin() {
    if (!valueUsuario.trim() || !valuePassword.trim()) {
      showToast('error', 'Campos requeridos', 'Ingrese usuario y contraseña');
      return;
    }

    setLoading(true);
    try {
      const response = await metodoRest.metodoPostPublico(AUTH_ENDPOINTS.login, {
        username: valueUsuario,
        password: valuePassword,
      });

      if (response.data && response.data.token) {
        const { token, username, expiresIn } = response.data;
        const role = response.data.role || decodeJwtRole(token);

        dataStore.setAuth(username || valueUsuario, token, role);

        showToast('success', 'Bienvenido', `Hola, ${username || valueUsuario}`);
        setIsLoggedIn(true);
      } else {
        showToast('warn', 'Error de acceso', 'Respuesta inesperada del servidor');
      }
    } catch (error) {
      const mensaje = error.response?.data?.message || 'Usuario o contraseña incorrectos';
      showToast('warn', 'Acceso denegado', mensaje);
      setValuePassword('');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') validarLogin();
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#f69f43',
      }}
    >
      <Toast ref={toast} />
      <div className="m-card">
        <div className="p-grid">
          <img
            src="assets/layout/images/EdimcaLogov2.png"
            alt="Edimca Logo"
            className="logo"
          />
          <div className="form-fields">
            <div className="p-field">
              <span className="p-float-label">
                <InputText
                  id="username"
                  type="text"
                  placeholder="Usuario"
                  style={{ height: '50px' }}
                  value={valueUsuario}
                  onChange={(e) => setValueUsuario(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={loading}
                />
              </span>
            </div>
            <div className="p-field">
              <span className="p-float-label">
                <Password
                  id="password"
                  placeholder="Contraseña"
                  style={{ height: '50px' }}
                  value={valuePassword}
                  onChange={(e) => setValuePassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  feedback={false}
                  disabled={loading}
                  toggleMask
                />
              </span>
            </div>
            <Button
              label={loading ? 'Ingresando...' : 'Ingresar'}
              className="p-button-raised"
              onClick={validarLogin}
              loading={loading}
              disabled={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
});
