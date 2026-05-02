import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { useDataStore } from '../data/DataStoreContext';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Password } from 'primereact/password';
import { InputSwitch } from 'primereact/inputswitch';
import axiosInstance from '../middleware/api/axiosInstance';
import { USUARIO_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

export const Configuracion = observer(() => {
    const dataStore = useDataStore();
    const toast = useRef(null);
    const [perfil, setPerfil] = useState({ nombreusuario: '', apellidousuario: '', email: '', telefono: '' });
    const [notifs, setNotifs] = useState({ notifVenta: true, notifStock: true, notifSistema: true });
    const [pwd, setPwd] = useState({ passwordActual: '', passwordNuevo: '', confirmar: '' });
    const [showPwd, setShowPwd] = useState(false);
    const [modoSeguro, setModoSeguro] = useState(false);
    const [tema, setTema] = useState(dataStore.darkMode ? 'oscuro' : 'claro');
    const [userId, setUserId] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        axiosInstance.get(USUARIO_ENDPOINTS.perfil).then(res => {
            const u = res.data;
            setUserId(u.idusuario);
            setPerfil({ nombreusuario: u.nombreusuario || '', apellidousuario: u.apellidousuario || '', email: u.email || '', telefono: u.telefono || '' });
            setNotifs({ notifVenta: u.notifVenta !== false, notifStock: u.notifStock !== false, notifSistema: u.notifSistema !== false });
            setModoSeguro(u.modoSeguro || false);
        }).catch(() => {});
    }, []);

    const showToast = (tipo, titulo, msg) => toast.current?.show({ severity: tipo, summary: titulo, detail: msg, life: 3000 });

    const guardarPerfil = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            await axiosInstance.put(USUARIO_ENDPOINTS.actualizar(userId), perfil);
            showToast('success', 'Guardado', 'Perfil actualizado correctamente');
        } catch { showToast('error', 'Error', 'No se pudo guardar el perfil'); }
        finally { setLoading(false); }
    };

    const guardarNotifs = async () => {
        if (!userId) return;
        try {
            await axiosInstance.put(USUARIO_ENDPOINTS.configuracion(userId), { ...notifs, modoSeguro });
            showToast('success', 'Guardado', 'Preferencias actualizadas');
        } catch { showToast('error', 'Error', 'No se pudo guardar'); }
    };

    const cambiarPassword = async () => {
        if (!pwd.passwordNuevo || pwd.passwordNuevo !== pwd.confirmar) {
            showToast('warn', 'Atención', 'Las contraseñas no coinciden'); return;
        }
        if (!userId) return;
        try {
            await axiosInstance.put(USUARIO_ENDPOINTS.password(userId), { passwordActual: pwd.passwordActual, passwordNuevo: pwd.passwordNuevo });
            showToast('success', 'Listo', 'Contraseña cambiada exitosamente');
            setPwd({ passwordActual: '', passwordNuevo: '', confirmar: '' });
        } catch (e) { showToast('error', 'Error', e.response?.data?.message || 'No se pudo cambiar la contraseña'); }
    };

    const aplicarTema = (t) => {
        setTema(t);
        if (t === 'oscuro') dataStore.setDarkMode(true);
        else if (t === 'claro') dataStore.setDarkMode(false);
        else dataStore.setDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    };

    const initials = (dataStore.authUser || 'US').substring(0, 2).toUpperCase();

    return (
        <div>
            <Toast ref={toast} />
            <div className="pos-page-header">
                <h2 className="pos-page-title">Configuración</h2>
                <p className="pos-page-subtitle">Gestiona tu perfil y preferencias</p>
            </div>

            {/* User Header Card */}
            <div className="pos-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#f69f43', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.2rem' }}>{initials}</div>
                <div>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{perfil.nombreusuario} {perfil.apellidousuario}</div>
                    <div style={{ color: '#64748b', fontSize: '0.85rem' }}>{perfil.email || dataStore.authUser}</div>
                    <span style={{ background: '#1976d2', color: '#fff', fontSize: '0.7rem', padding: '2px 10px', borderRadius: '999px', fontWeight: 600 }}>{dataStore.userRole}</span>
                </div>
            </div>

            {/* Perfil */}
            <div className="pos-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="pi pi-user" style={{ color: '#1976d2' }} /></div>
                    <div><div style={{ fontWeight: 600 }}>Perfil</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Información personal y preferencias</div></div>
                </div>
                <div className="p-grid">
                    <div className="p-col-12 p-md-6 p-field">
                        <label>Nombre</label>
                        <InputText value={perfil.nombreusuario} onChange={e => setPerfil(p => ({ ...p, nombreusuario: e.target.value }))} className="p-inputtext-sm" style={{ width: '100%', marginTop: 4 }} />
                    </div>
                    <div className="p-col-12 p-md-6 p-field">
                        <label>Apellido</label>
                        <InputText value={perfil.apellidousuario} onChange={e => setPerfil(p => ({ ...p, apellidousuario: e.target.value }))} className="p-inputtext-sm" style={{ width: '100%', marginTop: 4 }} />
                    </div>
                    <div className="p-col-12 p-field">
                        <label>Correo electrónico</label>
                        <InputText value={perfil.email} onChange={e => setPerfil(p => ({ ...p, email: e.target.value }))} className="p-inputtext-sm" style={{ width: '100%', marginTop: 4 }} />
                    </div>
                    <div className="p-col-12 p-field">
                        <label>Teléfono</label>
                        <InputText value={perfil.telefono} onChange={e => setPerfil(p => ({ ...p, telefono: e.target.value }))} className="p-inputtext-sm" style={{ width: '100%', marginTop: 4 }} />
                    </div>
                </div>
                <Button label="Guardar cambios" icon="pi pi-check" onClick={guardarPerfil} loading={loading} style={{ marginTop: '0.5rem' }} />
            </div>

            {/* Notificaciones */}
            <div className="pos-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="pi pi-bell" style={{ color: '#f59e0b' }} /></div>
                    <div><div style={{ fontWeight: 600 }}>Notificaciones</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Alertas y recordatorios</div></div>
                </div>
                {[
                    { key: 'notifVenta', label: 'Nueva venta registrada', desc: 'Recibe alerta cuando se registre una venta' },
                    { key: 'notifStock', label: 'Stock bajo', desc: 'Alerta cuando un producto esté bajo stock mínimo' },
                    { key: 'notifSistema', label: 'Notificaciones del sistema', desc: 'Actualizaciones y mantenimiento' },
                ].map(n => (
                    <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid #f8fafc' }}>
                        <div><div style={{ fontWeight: 500 }}>{n.label}</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>{n.desc}</div></div>
                        <InputSwitch checked={notifs[n.key]} onChange={e => setNotifs(p => ({ ...p, [n.key]: e.value }))} />
                    </div>
                ))}
                <Button label="Guardar preferencias" icon="pi pi-check" className="p-button-outlined" onClick={guardarNotifs} style={{ marginTop: '1rem' }} />
            </div>

            {/* Seguridad */}
            <div className="pos-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="pi pi-shield" style={{ color: '#22c55e' }} /></div>
                    <div><div style={{ fontWeight: 600 }}>Seguridad</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cambio de contraseña y configuración</div></div>
                </div>
                <div className="p-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Contraseña actual</label>
                    <Password value={pwd.passwordActual} onChange={e => setPwd(p => ({ ...p, passwordActual: e.target.value }))} feedback={false} toggleMask={showPwd} style={{ width: '100%', marginTop: 4 }} inputStyle={{ width: '100%' }} />
                </div>
                <div className="p-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Nueva contraseña</label>
                    <Password value={pwd.passwordNuevo} onChange={e => setPwd(p => ({ ...p, passwordNuevo: e.target.value }))} feedback={false} toggleMask={showPwd} style={{ width: '100%', marginTop: 4 }} inputStyle={{ width: '100%' }} />
                </div>
                <div className="p-field" style={{ marginBottom: '0.75rem' }}>
                    <label>Confirmar nueva contraseña</label>
                    <Password value={pwd.confirmar} onChange={e => setPwd(p => ({ ...p, confirmar: e.target.value }))} feedback={false} toggleMask={showPwd} style={{ width: '100%', marginTop: 4 }} inputStyle={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <input type="checkbox" id="showpwd" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} />
                    <label htmlFor="showpwd" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Mostrar contraseñas</label>
                </div>
                <Button label="Cambiar contraseña" icon="pi pi-shield" onClick={cambiarPassword} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                    <div>
                        <div style={{ fontWeight: 500 }}>Modo seguro</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Cierra sesión automáticamente después de 30 min de inactividad</div>
                    </div>
                    <InputSwitch checked={modoSeguro} onChange={e => setModoSeguro(e.value)} />
                </div>
            </div>

            {/* Apariencia */}
            <div className="pos-card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#fdf4ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="pi pi-palette" style={{ color: '#a855f7' }} /></div>
                    <div><div style={{ fontWeight: 600 }}>Apariencia</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Tema y configuración visual</div></div>
                </div>
                <div style={{ fontWeight: 600, marginBottom: '0.75rem' }}>Tema</div>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {[
                        { key: 'claro', icon: 'pi pi-sun', label: 'Claro' },
                        { key: 'oscuro', icon: 'pi pi-moon', label: 'Oscuro' },
                        { key: 'sistema', icon: 'pi pi-desktop', label: 'Sistema' },
                    ].map(t => (
                        <div key={t.key} onClick={() => aplicarTema(t.key)} style={{ flex: 1, minWidth: 100, border: `2px solid ${tema === t.key ? '#1976d2' : '#e2e8f0'}`, borderRadius: 12, padding: '1rem', cursor: 'pointer', textAlign: 'center', background: tema === t.key ? '#eff6ff' : '#fff', transition: 'all 0.2s' }}>
                            <i className={t.icon} style={{ fontSize: '1.5rem', color: tema === t.key ? '#1976d2' : '#94a3b8', display: 'block', marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 600, color: tema === t.key ? '#1976d2' : '#1e293b' }}>{t.label}</div>
                            {tema === t.key && <i className="pi pi-check" style={{ color: '#1976d2', fontSize: '0.8rem', marginTop: '0.25rem' }} />}
                        </div>
                    ))}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.75rem' }}>El tema se aplica de forma inmediata en toda la aplicación.</div>
            </div>

            {/* Sistema */}
            <div className="pos-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><i className="pi pi-database" style={{ color: '#64748b' }} /></div>
                    <div><div style={{ fontWeight: 600 }}>Sistema</div><div style={{ fontSize: '0.8rem', color: '#64748b' }}>Información del sistema y versión</div></div>
                </div>
                <div className="p-grid">
                    {[
                        ['VERSIÓN', 'v2.0.0'], ['ENTORNO', 'production'],
                        ['FRONTEND', 'React 17 + Vite'], ['BACKEND', 'Spring Boot 3.2.5'],
                        ['BASE DE DATOS', 'PostgreSQL 16'], ['ORM', 'JPA / Hibernate'],
                        ['AUTH', 'JWT (HS256)'], ['AÑO', '2026'],
                    ].map(([k, v]) => (
                        <div key={k} className="p-col-12 p-md-6" style={{ padding: '0.5rem' }}>
                            <div style={{ background: '#f8fafc', borderRadius: 8, padding: '0.75rem' }}>
                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{k}</div>
                                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{v}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
});
