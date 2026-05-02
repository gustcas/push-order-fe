import React, { useEffect, useState } from 'react';
import { observer } from 'mobx-react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useToast } from './shared/ToastContext';
import { metodoRest } from '../middleware/api/metodoRest';
import { CAJA_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';
import axiosInstance from '../middleware/api/axiosInstance';

const Caja = observer(() => {
  const toast = useToast();
  const [cajaActiva, setCajaActiva] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(false);
  const [abrirDialog, setAbrirDialog] = useState(false);
  const [cerrarDialog, setCerrarDialog] = useState(false);
  const [formAbrir, setFormAbrir] = useState({ montoInicial: '', observaciones: '' });
  const [formCerrar, setFormCerrar] = useState({ montoFinal: '', observaciones: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    try {
      const [activa, lista] = await Promise.allSettled([
        metodoRest.metodoGetData(CAJA_ENDPOINTS.activa),
        metodoRest.metodoGetData(CAJA_ENDPOINTS.listar),
      ]);
      setCajaActiva(activa.status === 'fulfilled' ? activa.value : null);
      setHistorial(lista.status === 'fulfilled' ? (Array.isArray(lista.value) ? lista.value : []) : []);
    } catch {
      toast?.error('Error', 'No se pudo cargar la caja');
    } finally {
      setLoading(false);
    }
  }

  async function abrirCaja() {
    if (!formAbrir.montoInicial) {
      toast?.warn('Validación', 'Ingrese el monto inicial');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.post(CAJA_ENDPOINTS.abrir, {
        montoInicial: parseFloat(formAbrir.montoInicial),
        observaciones: formAbrir.observaciones,
      });
      toast?.success('Caja abierta', 'La caja fue abierta correctamente');
      setAbrirDialog(false);
      setFormAbrir({ montoInicial: '', observaciones: '' });
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo abrir la caja');
    } finally {
      setSubmitting(false);
    }
  }

  async function cerrarCaja() {
    if (!formCerrar.montoFinal) {
      toast?.warn('Validación', 'Ingrese el monto final');
      return;
    }
    setSubmitting(true);
    try {
      await axiosInstance.put(CAJA_ENDPOINTS.cerrar(cajaActiva.idcaja || cajaActiva.id), {
        montoFinal: parseFloat(formCerrar.montoFinal),
        observaciones: formCerrar.observaciones,
      });
      toast?.success('Caja cerrada', 'La caja fue cerrada correctamente');
      setCerrarDialog(false);
      setFormCerrar({ montoFinal: '', observaciones: '' });
      cargar();
    } catch {
      toast?.error('Error', 'No se pudo cerrar la caja');
    } finally {
      setSubmitting(false);
    }
  }

  const estadoBadge = (rowData) => {
    const estado = rowData.estado;
    const severity = estado === 'A' ? 'success' : estado === 'C' ? 'warning' : 'danger';
    const label = estado === 'A' ? 'Abierta' : estado === 'C' ? 'Cerrada' : 'Inactiva';
    return <Tag value={label} severity={severity} />;
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2 style={{ marginTop: 0 }}>Caja</h2>

      {cajaActiva ? (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ margin: '0 0 0.75rem 0', color: '#16a34a' }}>
                <i className="pi pi-check-circle" style={{ marginRight: '0.5rem' }} />
                Caja Abierta
              </h3>
              <div className="p-grid" style={{ margin: 0 }}>
                {[
                  { label: 'Abierta el', value: cajaActiva.fechaApertura || cajaActiva.fechacreacion || '-' },
                  { label: 'Usuario', value: cajaActiva.usuario || cajaActiva.nombreusuario || '-' },
                  { label: 'Monto Inicial', value: `$${(cajaActiva.montoInicial || 0).toFixed(2)}` },
                  { label: 'Total Ventas', value: `$${(cajaActiva.totalVentas || 0).toFixed(2)}` },
                ].map((item) => (
                  <div key={item.label} className="p-col-12 p-md-6" style={{ padding: '0.25rem 0.5rem' }}>
                    <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>{item.label}</span>
                    <span style={{ fontWeight: 600 }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button
              label="Cerrar Caja"
              icon="pi pi-lock"
              className="p-button-danger"
              onClick={() => setCerrarDialog(true)}
            />
          </div>
        </div>
      ) : (
        <div
          style={{
            background: '#fff',
            borderRadius: '12px',
            boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          <i className="pi pi-lock" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: '1rem', display: 'block' }} />
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>No hay caja abierta</p>
          <Button
            label="Abrir Caja"
            icon="pi pi-unlock"
            className="p-button-success"
            onClick={() => setAbrirDialog(true)}
          />
        </div>
      )}

      <div className="card">
        <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Historial de Cajas</h3>
        <DataTable value={historial} loading={loading} dataKey="idcaja" paginator rows={10}>
          <Column field="fechaApertura" header="Fecha Apertura" />
          <Column field="usuario" header="Usuario" />
          <Column
            field="montoInicial"
            header="Monto Inicial"
            body={(r) => `$${(r.montoInicial || 0).toFixed(2)}`}
          />
          <Column
            field="totalVentas"
            header="Total Ventas"
            body={(r) => `$${(r.totalVentas || 0).toFixed(2)}`}
          />
          <Column header="Estado" body={estadoBadge} />
        </DataTable>
      </div>

      <Dialog
        visible={abrirDialog}
        header="Abrir Caja"
        modal
        style={{ width: '400px' }}
        footer={
          <div>
            <Button label="Cancelar" className="p-button-text" onClick={() => setAbrirDialog(false)} />
            <Button label="Abrir" icon="pi pi-unlock" onClick={abrirCaja} loading={submitting} />
          </div>
        }
        onHide={() => setAbrirDialog(false)}
      >
        <div className="p-fluid">
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label>Monto Inicial <span style={{ color: 'red' }}>*</span></label>
            <InputText
              type="number"
              step="0.01"
              value={formAbrir.montoInicial}
              onChange={(e) => setFormAbrir({ ...formAbrir, montoInicial: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="p-field">
            <label>Observaciones</label>
            <InputText
              value={formAbrir.observaciones}
              onChange={(e) => setFormAbrir({ ...formAbrir, observaciones: e.target.value })}
            />
          </div>
        </div>
      </Dialog>

      <Dialog
        visible={cerrarDialog}
        header="Cerrar Caja"
        modal
        style={{ width: '450px' }}
        footer={
          <div>
            <Button label="Cancelar" className="p-button-text" onClick={() => setCerrarDialog(false)} />
            <Button label="Cerrar Caja" icon="pi pi-lock" className="p-button-danger" onClick={cerrarCaja} loading={submitting} />
          </div>
        }
        onHide={() => setCerrarDialog(false)}
      >
        <div className="p-fluid">
          {cajaActiva && (
            <div
              style={{
                background: '#f8fafc',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Efectivo</span>
                <span style={{ fontWeight: 600 }}>${(cajaActiva.totalEfectivo || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ color: '#64748b' }}>Tarjeta</span>
                <span style={{ fontWeight: 600 }}>${(cajaActiva.totalTarjeta || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e2e8f0', paddingTop: '0.5rem' }}>
                <span style={{ fontWeight: 700 }}>Total</span>
                <span style={{ fontWeight: 700, color: '#16a34a' }}>${(cajaActiva.totalVentas || 0).toFixed(2)}</span>
              </div>
            </div>
          )}
          <div className="p-field" style={{ marginBottom: '1rem' }}>
            <label>Monto Final <span style={{ color: 'red' }}>*</span></label>
            <InputText
              type="number"
              step="0.01"
              value={formCerrar.montoFinal}
              onChange={(e) => setFormCerrar({ ...formCerrar, montoFinal: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="p-field">
            <label>Observaciones</label>
            <InputText
              value={formCerrar.observaciones}
              onChange={(e) => setFormCerrar({ ...formCerrar, observaciones: e.target.value })}
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
});

export default Caja;
