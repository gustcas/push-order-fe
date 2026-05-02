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
import { CATEGORIA_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';
import axiosInstance from '../middleware/api/axiosInstance';

const emptyCategoria = { nombre: '', descripcion: '', estado: 'A' };

const Categorias = observer(() => {
  const toast = useToast();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [form, setForm] = useState(emptyCategoria);
  const [editId, setEditId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isMobile = window.innerWidth < 768;

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const data = await metodoRest.metodoGetData(CATEGORIA_ENDPOINTS.listar);
      setCategorias(Array.isArray(data) ? data : []);
    } catch {
      toast?.error('Error', 'No se pudo cargar las categorías');
    } finally {
      setLoading(false);
    }
  }

  function abrirNueva() {
    setForm(emptyCategoria);
    setEditId(null);
    setDialogVisible(true);
  }

  function abrirEditar(cat) {
    setForm({ nombre: cat.nombre || '', descripcion: cat.descripcion || '', estado: cat.estado || 'A' });
    setEditId(cat.idcategoria || cat.id);
    setDialogVisible(true);
  }

  async function guardar() {
    if (!form.nombre.trim()) {
      toast?.warn('Validación', 'El nombre es requerido');
      return;
    }
    setSubmitting(true);
    try {
      if (editId) {
        await axiosInstance.put(CATEGORIA_ENDPOINTS.actualizar(editId), form);
        toast?.success('Actualizado', 'Categoría actualizada correctamente');
      } else {
        await axiosInstance.post(CATEGORIA_ENDPOINTS.crear, form);
        toast?.success('Creado', 'Categoría creada correctamente');
      }
      setDialogVisible(false);
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo guardar la categoría');
    } finally {
      setSubmitting(false);
    }
  }

  function confirmarEliminar(cat) {
    confirmDialog({
      message: `¿Eliminar la categoría "${cat.nombre}"?`,
      header: 'Confirmar eliminación',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Eliminar',
      rejectLabel: 'Cancelar',
      acceptClassName: 'p-button-danger',
      accept: () => eliminar(cat),
    });
  }

  async function eliminar(cat) {
    try {
      await axiosInstance.delete(CATEGORIA_ENDPOINTS.eliminar(cat.idcategoria || cat.id));
      toast?.success('Eliminado', 'Categoría eliminada');
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo eliminar la categoría');
    }
  }

  const estadoBadge = (rowData) => {
    const estado = rowData.estado;
    const severity = estado === 'A' ? 'success' : estado === 'I' ? 'danger' : 'warning';
    const label = estado === 'A' ? 'Activo' : estado === 'I' ? 'Inactivo' : 'Cerrado';
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
      <Button
        label="Cancelar"
        icon="pi pi-times"
        className="p-button-text"
        onClick={() => setDialogVisible(false)}
      />
      <Button
        label="Guardar"
        icon="pi pi-check"
        onClick={guardar}
        loading={submitting}
      />
    </div>
  );

  const leftToolbar = (
    <Button label="Nueva Categoría" icon="pi pi-plus" className="p-button-success" onClick={abrirNueva} />
  );

  return (
    <div style={{ padding: '1rem' }}>
      <ConfirmDialog />
      <h2 style={{ marginTop: 0 }}>Categorías</h2>

      <Toolbar left={leftToolbar} style={{ marginBottom: '1rem' }} />

      {isMobile ? (
        <div>
          {categorias.map((cat) => (
            <div
              key={cat.idcategoria || cat.id}
              style={{
                background: '#fff',
                borderRadius: '10px',
                boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
                padding: '1rem',
                marginBottom: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{cat.nombre}</div>
                  <div style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                    {cat.descripcion}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
                  {estadoBadge(cat)}
                  <Button
                    icon="pi pi-pencil"
                    className="p-button-rounded p-button-text p-button-sm"
                    onClick={() => abrirEditar(cat)}
                  />
                  <Button
                    icon="pi pi-trash"
                    className="p-button-rounded p-button-text p-button-danger p-button-sm"
                    onClick={() => confirmarEliminar(cat)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <DataTable value={categorias} loading={loading} dataKey="idcategoria" paginator rows={10}>
            <Column field="nombre" header="Nombre" sortable />
            <Column field="descripcion" header="Descripción" />
            <Column header="Estado" body={estadoBadge} />
            <Column header="Acciones" body={acciones} style={{ width: '120px' }} />
          </DataTable>
        </div>
      )}

      <Dialog
        visible={dialogVisible}
        header={editId ? 'Editar Categoría' : 'Nueva Categoría'}
        modal
        style={{ width: '400px' }}
        footer={dialogFooter}
        onHide={() => setDialogVisible(false)}
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label htmlFor="nombre">
              Nombre <span style={{ color: 'red' }}>*</span>
            </label>
            <InputText
              id="nombre"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            />
          </div>
          <div className="p-field">
            <label htmlFor="descripcion">Descripción</label>
            <InputText
              id="descripcion"
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
});

export default Categorias;
