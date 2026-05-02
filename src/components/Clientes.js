import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { useToast } from './shared/ToastContext';
import { metodoRest } from '../middleware/api/metodoRest';
import { CLIENTE_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';
import axiosInstance from '../middleware/api/axiosInstance';

const emptyCliente = {
  nombres: '',
  apellidos: '',
  cedula: '',
  email: '',
  telefono: '',
  direccion: '',
  estado: 'A',
};

const Clientes = observer(() => {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [filtrados, setFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(emptyCliente);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    cargar();
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const q = busqueda.toLowerCase();
    setFiltrados(
      clientes.filter(
        (c) =>
          c.nombres?.toLowerCase().includes(q) ||
          c.apellidos?.toLowerCase().includes(q) ||
          c.cedula?.toLowerCase().includes(q)
      )
    );
  }, [busqueda, clientes]);

  async function cargar() {
    setLoading(true);
    try {
      const data = await metodoRest.metodoGetData(CLIENTE_ENDPOINTS.listar);
      const lista = Array.isArray(data) ? data : [];
      setClientes(lista);
      setFiltrados(lista);
    } catch {
      toast?.error('Error', 'No se pudo cargar los clientes');
    } finally {
      setLoading(false);
    }
  }

  function abrirNuevo() {
    setForm(emptyCliente);
    setEditId(null);
    setDialogVisible(true);
  }

  function abrirEditar(c) {
    setForm({
      nombres: c.nombres || '',
      apellidos: c.apellidos || '',
      cedula: c.cedula || '',
      email: c.email || '',
      telefono: c.telefono || '',
      direccion: c.direccion || '',
      estado: c.estado || 'A',
    });
    setEditId(c.idcliente || c.id);
    setDialogVisible(true);
  }

  async function guardar() {
    if (!form.nombres.trim() || !form.cedula.trim()) {
      toast?.warn('Validación', 'Nombres y Cédula son requeridos');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await axiosInstance.put(CLIENTE_ENDPOINTS.actualizar(editId), form);
        toast?.success('Actualizado', 'Cliente actualizado correctamente');
      } else {
        await axiosInstance.post(CLIENTE_ENDPOINTS.crear, form);
        toast?.success('Creado', 'Cliente creado correctamente');
      }
      setDialogVisible(false);
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo guardar el cliente');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmarEliminar(c) {
    confirmDialog({
      message: `¿Eliminar a ${c.nombres} ${c.apellidos}?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => eliminar(c),
    });
  }

  async function eliminar(c) {
    try {
      await axiosInstance.delete(CLIENTE_ENDPOINTS.eliminar(c.idcliente || c.id));
      toast?.success('Eliminado', 'Cliente eliminado');
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo eliminar el cliente');
    }
  }

  const estadoBadge = (rowData) => {
    const estado = rowData.estado;
    const severity = estado === 'A' ? 'success' : 'danger';
    const label = estado === 'A' ? 'Activo' : 'Inactivo';
    return <Tag value={label} severity={severity} />;
  };

  const acciones = (rowData) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button
        icon="pi pi-pencil"
        className="p-button-rounded p-button-text p-button-info"
        onClick={() => abrirEditar(rowData)}
      />
      <Button
        icon="pi pi-trash"
        className="p-button-rounded p-button-text p-button-danger"
        onClick={() => confirmarEliminar(rowData)}
      />
    </div>
  );

  const dialogFooter = (
    <div>
      <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => setDialogVisible(false)} />
      <Button label="Guardar" icon="pi pi-check" onClick={guardar} loading={submitting} />
    </div>
  );

  const leftToolbar = (
    <Button label="Nuevo Cliente" icon="pi pi-plus" className="p-button-success" onClick={abrirNuevo} />
  );

  const rightToolbar = (
    <span className="p-input-icon-left">
      <i className="pi pi-search" />
      <InputText
        placeholder="Buscar por nombre o cédula"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        style={{ width: '260px' }}
      />
    </span>
  );

  return (
    <div style={{ padding: '1rem' }}>
      <ConfirmDialog />
      <h2 style={{ marginTop: 0 }}>Clientes</h2>

      <Toolbar left={leftToolbar} right={rightToolbar} style={{ marginBottom: '1rem' }} />

      {isMobile ? (
        <div>
          {filtrados.map((c) => (
            <div
              key={c.idcliente || c.id}
              style={{
                background: '#fff',
                borderRadius: '10px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                padding: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  {[
                    { label: 'NOMBRE', value: `${c.nombres} ${c.apellidos}` },
                    { label: 'CÉDULA', value: c.cedula },
                    { label: 'EMAIL', value: c.email },
                    { label: 'TELÉFONO', value: c.telefono },
                  ].map((row) => (
                    <div key={row.label} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', minWidth: '80px', fontWeight: 600 }}>
                        {row.label}
                      </span>
                      <span style={{ fontSize: '0.85rem' }}>{row.value || '-'}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', alignItems: 'flex-end' }}>
                  {estadoBadge(c)}
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-sm"
                    onClick={() => abrirEditar(c)}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    onClick={() => confirmarEliminar(c)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <DataTable value={filtrados} loading={loading} dataKey="idcliente" paginator rows={10}>
            <Column field="nombres" header="Nombres" sortable />
            <Column field="apellidos" header="Apellidos" sortable />
            <Column field="cedula" header="Cédula" />
            <Column field="email" header="Email" />
            <Column field="telefono" header="Teléfono" />
            <Column header="Estado" body={estadoBadge} />
            <Column header="Acciones" body={acciones} style={{ width: '120px' }} />
          </DataTable>
        </div>
      )}

      <Dialog
        visible={dialogVisible}
        header={editId ? 'Editar Cliente' : 'Nuevo Cliente'}
        modal
        style={{ width: '480px' }}
        footer={dialogFooter}
        onHide={() => setDialogVisible(false)}
      >
        <div className="p-fluid p-formgrid p-grid">
          <div className="p-field p-col-12 p-md-6">
            <label>Nombres <span style={{ color: 'red' }}>*</span></label>
            <InputText value={form.nombres} onChange={(e) => setForm({ ...form, nombres: e.target.value })} />
          </div>
          <div className="p-field p-col-12 p-md-6">
            <label>Apellidos</label>
            <InputText value={form.apellidos} onChange={(e) => setForm({ ...form, apellidos: e.target.value })} />
          </div>
          <div className="p-field p-col-12 p-md-6">
            <label>Cédula <span style={{ color: 'red' }}>*</span></label>
            <InputText value={form.cedula} onChange={(e) => setForm({ ...form, cedula: e.target.value })} />
          </div>
          <div className="p-field p-col-12 p-md-6">
            <label>Email</label>
            <InputText value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="p-field p-col-12 p-md-6">
            <label>Teléfono</label>
            <InputText value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div className="p-field p-col-12">
            <label>Dirección</label>
            <InputText value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
        </div>
      </Dialog>
    </div>
  );
});

export default Clientes;
