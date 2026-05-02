import React, { useState, useEffect, useRef } from 'react';
import { observer } from 'mobx-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Password } from 'primereact/password';
import axiosInstance from '../middleware/api/axiosInstance';
import { USUARIO_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

const emptyUser = { nombreusuario: '', apellidousuario: '', usuario: '', email: '', telefono: '', password: '', idrol: null };

export const Usuarios = observer(() => {
    const toast = useRef(null);
    const [usuarios, setUsuarios] = useState([]);
    const [roles, setRoles] = useState([]);
    const [dialog, setDialog] = useState(false);
    const [form, setForm] = useState(emptyUser);
    const [editId, setEditId] = useState(null);
    const [loading, setLoading] = useState(false);
    const isMobile = window.innerWidth < 768;

    useEffect(() => {
        cargar();
        axiosInstance.get(USUARIO_ENDPOINTS.roles).then(r => setRoles(r.data.map(rol => ({ label: rol.nombre, value: rol.idrol })))).catch(() => {});
    }, []);

    const cargar = async () => {
        setLoading(true);
        try { const r = await axiosInstance.get(USUARIO_ENDPOINTS.listar); setUsuarios(r.data); }
        catch { showToast('error', 'Error', 'No se pudieron cargar los usuarios'); }
        finally { setLoading(false); }
    };

    const showToast = (t, s, d) => toast.current?.show({ severity: t, summary: s, detail: d, life: 3000 });

    const abrirNuevo = () => { setForm(emptyUser); setEditId(null); setDialog(true); };
    const abrirEditar = (u) => { setForm({ nombreusuario: u.nombreusuario, apellidousuario: u.apellidousuario, usuario: u.usuario, email: u.email || '', telefono: u.telefono || '', password: '', idrol: u.idrol }); setEditId(u.idusuario); setDialog(true); };

    const guardar = async () => {
        if (!form.nombreusuario || !form.usuario) { showToast('warn', 'Atención', 'Nombre y usuario son requeridos'); return; }
        try {
            if (editId) await axiosInstance.put(USUARIO_ENDPOINTS.actualizar(editId), form);
            else await axiosInstance.post(USUARIO_ENDPOINTS.crear, form);
            showToast('success', 'Guardado', editId ? 'Usuario actualizado' : 'Usuario creado');
            setDialog(false); cargar();
        } catch (e) { showToast('error', 'Error', e.response?.data?.message || 'No se pudo guardar'); }
    };

    const desactivar = (u) => {
        confirmDialog({
            message: `¿Desactivar al usuario "${u.usuario}"?`,
            header: 'Confirmar', icon: 'pi pi-exclamation-triangle', acceptClassName: 'p-button-danger',
            accept: async () => {
                try { await axiosInstance.delete(USUARIO_ENDPOINTS.desactivar(u.idusuario)); showToast('success', 'Desactivado', 'Usuario desactivado'); cargar(); }
                catch { showToast('error', 'Error', 'No se pudo desactivar'); }
            }
        });
    };

    const estadoTemplate = (u) => <Tag value={u.estado === 'A' ? 'Activo' : 'Inactivo'} severity={u.estado === 'A' ? 'success' : 'danger'} />;
    const rolTemplate = (u) => <Tag value={u.rolNombre || 'Sin rol'} severity={u.rolNombre === 'ADMIN' ? 'danger' : u.rolNombre === 'SUPERVISOR' ? 'warning' : 'info'} />;
    const accionesTemplate = (u) => (
        <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button icon="pi pi-pencil" className="p-button-rounded p-button-text p-button-info" onClick={() => abrirEditar(u)} tooltip="Editar" />
            {u.estado === 'A' && <Button icon="pi pi-ban" className="p-button-rounded p-button-text p-button-danger" onClick={() => desactivar(u)} tooltip="Desactivar" />}
        </div>
    );

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />
            <div className="pos-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div><h2 className="pos-page-title">Usuarios</h2><p className="pos-page-subtitle">Gestión de usuarios del sistema</p></div>
                <Button label="Nuevo usuario" icon="pi pi-plus" onClick={abrirNuevo} />
            </div>

            <div className="pos-card">
                {isMobile ? (
                    usuarios.map(u => (
                        <div key={u.idusuario} className="mobile-list-card">
                            <div className="mobile-list-card-title">{u.nombreusuario} {u.apellidousuario}</div>
                            {[['USUARIO', u.usuario], ['EMAIL', u.email], ['ROL', u.rolNombre]].map(([l, v]) => (
                                <div key={l} className="mobile-list-row"><span className="mobile-list-label">{l}</span><span className="mobile-list-value">{v}</span></div>
                            ))}
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                                {estadoTemplate(u)} {rolTemplate(u)}
                                <Button icon="pi pi-pencil" className="p-button-rounded p-button-sm p-button-outlined" onClick={() => abrirEditar(u)} />
                            </div>
                        </div>
                    ))
                ) : (
                    <DataTable value={usuarios} loading={loading} paginator rows={10} emptyMessage="No hay usuarios">
                        <Column field="nombreusuario" header="Nombre" />
                        <Column field="apellidousuario" header="Apellido" />
                        <Column field="usuario" header="Usuario" />
                        <Column field="email" header="Email" />
                        <Column header="Rol" body={rolTemplate} />
                        <Column header="Estado" body={estadoTemplate} />
                        <Column header="Acciones" body={accionesTemplate} />
                    </DataTable>
                )}
            </div>

            <Dialog header={editId ? 'Editar usuario' : 'Nuevo usuario'} visible={dialog} onHide={() => setDialog(false)} style={{ width: '480px' }}>
                <div className="p-grid">
                    {[['nombreusuario','Nombre*'],['apellidousuario','Apellido'],['usuario','Usuario*'],['email','Email'],['telefono','Teléfono']].map(([f,l]) => (
                        <div key={f} className="p-col-12 p-md-6 p-field">
                            <label>{l}</label>
                            <InputText value={form[f]} onChange={e => setForm(p => ({ ...p, [f]: e.target.value }))} style={{ width: '100%', marginTop: 4 }} />
                        </div>
                    ))}
                    {!editId && (
                        <div className="p-col-12 p-field">
                            <label>Contraseña*</label>
                            <Password value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} feedback={false} style={{ width: '100%', marginTop: 4 }} inputStyle={{ width: '100%' }} />
                        </div>
                    )}
                    <div className="p-col-12 p-field">
                        <label>Rol</label>
                        <Dropdown value={form.idrol} options={roles} onChange={e => setForm(p => ({ ...p, idrol: e.value }))} placeholder="Seleccione un rol" style={{ width: '100%', marginTop: 4 }} />
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <Button label="Cancelar" icon="pi pi-times" className="p-button-outlined p-button-secondary" onClick={() => setDialog(false)} />
                    <Button label="Guardar" icon="pi pi-check" onClick={guardar} />
                </div>
            </Dialog>
        </div>
    );
});
