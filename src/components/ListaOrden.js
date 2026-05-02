import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import axiosInstance from '../middleware/api/axiosInstance';
import { ORDEN_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';
import { useDataStore } from '../data/DataStoreContext';

const ESTADO_OPTIONS = [
    { label: 'Todas', value: '' },
    { label: 'Activas', value: 'A' },
    { label: 'Canceladas', value: 'C' },
];

export const ListaOrden = () => {
    const dataStore = useDataStore();
    const toast = useRef(null);
    const [ordenes, setOrdenes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [desde, setDesde] = useState(null);
    const [hasta, setHasta] = useState(null);
    const [estadoFiltro, setEstadoFiltro] = useState('');
    const [detalleDialog, setDetalleDialog] = useState(false);
    const [ordenSeleccionada, setOrdenSeleccionada] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        listar();
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const listar = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (desde) params.append('desde', desde.toISOString().slice(0, 10));
            if (hasta) params.append('hasta', hasta.toISOString().slice(0, 10));
            const qs = params.toString();
            const { data } = await axiosInstance.get(ORDEN_ENDPOINTS.listar + (qs ? '?' + qs : ''));
            let result = Array.isArray(data) ? data : [];
            if (estadoFiltro) result = result.filter(o => o.estado === estadoFiltro);
            setOrdenes(result);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar las órdenes', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const cancelar = (orden) => {
        confirmDialog({
            message: `¿Cancelar la orden ${orden.numerofactura || '#' + orden.idorden}? El stock será restaurado.`,
            header: 'Confirmar cancelación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, cancelar',
            rejectLabel: 'No',
            acceptClassName: 'p-button-danger',
            accept: async () => {
                try {
                    await axiosInstance.put(ORDEN_ENDPOINTS.cancelar(orden.idorden));
                    toast.current?.show({ severity: 'success', summary: 'Cancelada', detail: 'Orden cancelada y stock restaurado', life: 3000 });
                    listar();
                } catch (e) {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo cancelar', life: 3000 });
                }
            }
        });
    };

    const verDetalle = (orden) => {
        setOrdenSeleccionada(orden);
        setDetalleDialog(true);
    };

    const fmtCurrency = (v) => Number(v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

    const estadoTag = (o) => (
        <Tag
            severity={o.estado === 'A' ? 'success' : 'danger'}
            value={o.estado === 'A' ? 'Activa' : 'Cancelada'}
        />
    );

    const actions = (o) => (
        <div style={{ display: 'flex', gap: 4 }}>
            <Button icon="pi pi-eye" className="p-button-sm p-button-text" tooltip="Ver detalle" onClick={() => verDetalle(o)} />
            {o.estado === 'A' && dataStore.isSupervisor && (
                <Button icon="pi pi-times-circle" className="p-button-sm p-button-text p-button-danger" tooltip="Cancelar orden" onClick={() => cancelar(o)} />
            )}
        </div>
    );

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="pos-page-title" style={{ margin: 0 }}>Órdenes</h2>
            </div>

            {/* Filters */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="p-fluid p-formgrid p-grid">
                    <div className="p-field p-col-12 p-md-3">
                        <label>Desde</label>
                        <Calendar value={desde} onChange={e => setDesde(e.value)} dateFormat="dd/mm/yy" showIcon placeholder="Fecha inicio" />
                    </div>
                    <div className="p-field p-col-12 p-md-3">
                        <label>Hasta</label>
                        <Calendar value={hasta} onChange={e => setHasta(e.value)} dateFormat="dd/mm/yy" showIcon placeholder="Fecha fin" />
                    </div>
                    <div className="p-field p-col-12 p-md-3">
                        <label>Estado</label>
                        <Dropdown value={estadoFiltro} options={ESTADO_OPTIONS} onChange={e => setEstadoFiltro(e.value)} />
                    </div>
                    <div className="p-field p-col-12 p-md-3" style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button label="Buscar" icon="pi pi-search" onClick={listar} loading={loading} style={{ width: '100%' }} />
                    </div>
                </div>
            </div>

            {/* Summary */}
            {ordenes.length > 0 && (
                <div style={{ marginBottom: 12, color: '#64748b', fontSize: '0.85rem' }}>
                    {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''} |
                    Total activas: {fmtCurrency(ordenes.filter(o => o.estado === 'A').reduce((s, o) => s + Number(o.total || 0), 0))}
                </div>
            )}

            {isMobile ? (
                <div>
                    {ordenes.map(o => (
                        <div key={o.idorden} className="mobile-list-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span className="mobile-list-card-title" style={{ margin: 0 }}>
                                    {o.numerofactura || `#${o.idorden}`}
                                </span>
                                {estadoTag(o)}
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Cliente</span>
                                <span className="mobile-list-value">{o.nombrecliente}</span>
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Fecha</span>
                                <span className="mobile-list-value">{o.fechacreacionorden}</span>
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Método de pago</span>
                                <span className="mobile-list-value">{o.metodoPagoNombre || '—'}</span>
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Total</span>
                                <span className="mobile-list-value amount">{fmtCurrency(o.total)}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <Button icon="pi pi-eye" label="Ver detalle" className="p-button-sm p-button-outlined" style={{ flex: 1 }} onClick={() => verDetalle(o)} />
                                {o.estado === 'A' && dataStore.isSupervisor && (
                                    <Button icon="pi pi-times" label="Cancelar" className="p-button-sm p-button-outlined p-button-danger" style={{ flex: 1 }} onClick={() => cancelar(o)} />
                                )}
                            </div>
                        </div>
                    ))}
                    {ordenes.length === 0 && !loading && (
                        <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>Sin órdenes para el período seleccionado</p>
                    )}
                </div>
            ) : (
                <div className="card">
                    <DataTable value={ordenes} dataKey="idorden" paginator rows={10} loading={loading}
                        emptyMessage="Sin órdenes para el período seleccionado">
                        <Column field="idorden" header="ID" style={{ width: 60 }} />
                        <Column field="numerofactura" header="Factura" sortable />
                        <Column field="fechacreacionorden" header="Fecha" sortable />
                        <Column field="nombrecliente" header="Cliente" />
                        <Column field="metodoPagoNombre" header="Método Pago" />
                        <Column field="total" header="Total" body={o => <strong>{fmtCurrency(o.total)}</strong>} sortable />
                        <Column field="usuarioNombre" header="Cajero" />
                        <Column header="Estado" body={estadoTag} style={{ width: 100 }} />
                        <Column header="Acciones" body={actions} style={{ width: 90 }} />
                    </DataTable>
                </div>
            )}

            {/* Detail dialog */}
            <Dialog
                header={`Detalle: ${ordenSeleccionada?.numerofactura || ''}`}
                visible={detalleDialog}
                style={{ width: '580px' }}
                modal
                onHide={() => setDetalleDialog(false)}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            {ordenSeleccionada?.estado === 'A' && dataStore.isSupervisor && (
                                <Button
                                    label="Cancelar orden"
                                    icon="pi pi-times"
                                    className="p-button-danger p-button-outlined p-button-sm"
                                    onClick={() => { setDetalleDialog(false); cancelar(ordenSeleccionada); }}
                                />
                            )}
                        </div>
                        <Button label="Cerrar" icon="pi pi-times" className="p-button-text" onClick={() => setDetalleDialog(false)} />
                    </div>
                }
            >
                {ordenSeleccionada && (
                    <div>
                        <div style={{ marginBottom: 16 }}>
                            <div className="ol-row"><span className="ol-label">Factura</span><span style={{ fontWeight: 700, color: '#f69f43' }}>{ordenSeleccionada.numerofactura}</span></div>
                            <div className="ol-row"><span className="ol-label">Estado</span><span>{estadoTag(ordenSeleccionada)}</span></div>
                            <div className="ol-row"><span className="ol-label">Fecha</span><span>{ordenSeleccionada.fechacreacionorden}</span></div>
                            <div className="ol-row"><span className="ol-label">Cliente</span><span>{ordenSeleccionada.nombrecliente}</span></div>
                            {ordenSeleccionada.cedulacliente && <div className="ol-row"><span className="ol-label">Cédula</span><span>{ordenSeleccionada.cedulacliente}</span></div>}
                            <div className="ol-row"><span className="ol-label">Método de pago</span><span>{ordenSeleccionada.metodoPagoNombre || '—'}</span></div>
                            <div className="ol-row"><span className="ol-label">Cajero</span><span>{ordenSeleccionada.usuarioNombre || '—'}</span></div>
                        </div>

                        <DataTable value={ordenSeleccionada.detalles || []} dataKey="idordendetalle" style={{ marginBottom: 16 }}>
                            <Column field="nombreproducto" header="Producto" />
                            <Column field="cantidad" header="Cant." style={{ width: 60 }} />
                            <Column header="P. Unit." style={{ width: 90 }} body={d => fmtCurrency(d.preciounidad)} />
                            <Column header="Desc." style={{ width: 80 }} body={d => d.descuento ? `${d.descuento}%` : '—'} />
                            <Column header="Total" style={{ width: 100 }} body={d => <strong>{fmtCurrency(d.total)}</strong>} />
                        </DataTable>

                        <div className="ol-row"><span className="ol-label">Subtotal</span><span>{fmtCurrency(ordenSeleccionada.subtotal)}</span></div>
                        <div className="ol-row"><span className="ol-label">IVA 12%</span><span>{fmtCurrency(ordenSeleccionada.totaliva)}</span></div>
                        {Number(ordenSeleccionada.descuento) > 0 && <div className="ol-row"><span className="ol-label">Descuento</span><span style={{ color: '#22c55e' }}>- {fmtCurrency(ordenSeleccionada.descuento)}</span></div>}
                        <div className="ol-row ol-total"><span>TOTAL</span><span style={{ color: '#f69f43' }}>{fmtCurrency(ordenSeleccionada.total)}</span></div>
                    </div>
                )}
            </Dialog>

            <style>{`
                .ol-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e2e8f0; }
                .dark-mode .ol-row { border-color: #334155; }
                .ol-label { font-size: 0.8rem; font-weight: 600; color: #94a3b8; text-transform: uppercase; }
                .ol-total { font-size: 18px; font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: none; padding-top: 10px; margin-top: 4px; }
                .dark-mode .ol-total { border-color: #475569; }
            `}</style>
        </div>
    );
};
