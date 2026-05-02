import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import axiosInstance from '../middleware/api/axiosInstance';
import { PRODUCTO_ENDPOINTS, INVENTARIO_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

export const Inventario = () => {
    const toast = useRef(null);
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loadingProd, setLoadingProd] = useState(false);
    const [loadingMov, setLoadingMov] = useState(false);

    const [dialogVisible, setDialogVisible] = useState(false);
    const [dialogTipo, setDialogTipo] = useState('entrada'); // 'entrada' | 'ajuste'
    const [productoSel, setProductoSel] = useState(null);
    const [cantidad, setCantidad] = useState(0);
    const [referencia, setReferencia] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [saving, setSaving] = useState(false);

    const [soloStockBajo, setSoloStockBajo] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        cargarProductos();
        cargarMovimientos();
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const cargarProductos = async () => {
        setLoadingProd(true);
        try {
            const { data } = await axiosInstance.get(PRODUCTO_ENDPOINTS.listar);
            setProductos(Array.isArray(data) ? data : []);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo cargar el inventario', life: 3000 });
        } finally {
            setLoadingProd(false);
        }
    };

    const cargarMovimientos = async () => {
        setLoadingMov(true);
        try {
            const { data } = await axiosInstance.get(INVENTARIO_ENDPOINTS.movimientos);
            setMovimientos(Array.isArray(data) ? data : []);
        } catch {} finally {
            setLoadingMov(false);
        }
    };

    const abrirEntrada = (p) => {
        setProductoSel(p);
        setDialogTipo('entrada');
        setCantidad(1);
        setReferencia('');
        setObservaciones('');
        setDialogVisible(true);
    };

    const abrirAjuste = (p) => {
        setProductoSel(p);
        setDialogTipo('ajuste');
        setCantidad(p.stock || 0);
        setReferencia('');
        setObservaciones('');
        setDialogVisible(true);
    };

    const guardar = async () => {
        if (!cantidad && cantidad !== 0) return;
        setSaving(true);
        try {
            if (dialogTipo === 'entrada') {
                await axiosInstance.post(INVENTARIO_ENDPOINTS.entrada, {
                    idproducto: productoSel.idproducto,
                    cantidad,
                    referencia: referencia || 'ENTRADA MANUAL',
                });
                toast.current?.show({ severity: 'success', summary: 'Entrada registrada', detail: `+${cantidad} unidades de ${productoSel.nombreproducto}`, life: 3000 });
            } else {
                await axiosInstance.post(INVENTARIO_ENDPOINTS.ajuste, {
                    idproducto: productoSel.idproducto,
                    cantidad,
                    observaciones: observaciones || 'Ajuste manual',
                });
                toast.current?.show({ severity: 'success', summary: 'Stock ajustado', detail: `${productoSel.nombreproducto} → ${cantidad} unidades`, life: 3000 });
            }
            setDialogVisible(false);
            cargarProductos();
            cargarMovimientos();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo guardar', life: 3000 });
        } finally {
            setSaving(false);
        }
    };

    const fmtCurrency = (v) => Number(v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

    const productosFiltrados = soloStockBajo ? productos.filter(p => p.stockBajo) : productos;

    const stockTag = (p) => (
        p.stock <= 0
            ? <Tag severity="danger" value="Sin stock" />
            : p.stockBajo
                ? <Tag severity="warning" value={`${p.stock} ⚠`} />
                : <Tag severity="success" value={String(p.stock)} />
    );

    const tipoTag = (m) => {
        const map = {
            'S': { label: 'Venta', sev: 'danger' },
            'E': { label: 'Entrada', sev: 'success' },
            'A': { label: 'Ajuste', sev: 'info' },
        };
        const t = map[m.tipo] || { label: m.tipo, sev: 'secondary' };
        return <Tag severity={t.sev} value={t.label} />;
    };

    const actions = (p) => (
        <div style={{ display: 'flex', gap: 4 }}>
            <Button label="Entrada" icon="pi pi-arrow-down" className="p-button-sm p-button-success p-button-outlined" onClick={() => abrirEntrada(p)} />
            <Button label="Ajustar" icon="pi pi-pencil" className="p-button-sm p-button-outlined" onClick={() => abrirAjuste(p)} />
        </div>
    );

    return (
        <div>
            <Toast ref={toast} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 className="pos-page-title" style={{ margin: 0 }}>Inventario</h2>
                <Button
                    label={soloStockBajo ? 'Ver todos' : 'Solo stock bajo'}
                    icon={soloStockBajo ? 'pi pi-list' : 'pi pi-exclamation-triangle'}
                    className={`p-button-sm ${soloStockBajo ? 'p-button-outlined' : 'p-button-warning p-button-outlined'}`}
                    onClick={() => setSoloStockBajo(!soloStockBajo)}
                />
            </div>

            <TabView>
                <TabPanel header="Stock actual">
                    {isMobile ? (
                        <div>
                            {productosFiltrados.map(p => (
                                <div key={p.idproducto} className="mobile-list-card" style={p.stockBajo ? { borderLeft: '3px solid #f59e0b' } : {}}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <span className="mobile-list-card-title" style={{ margin: 0 }}>{p.nombreproducto}</span>
                                        {stockTag(p)}
                                    </div>
                                    <div className="mobile-list-row">
                                        <span className="mobile-list-label">Precio venta</span>
                                        <span className="mobile-list-value">{fmtCurrency(p.precioventa)}</span>
                                    </div>
                                    <div className="mobile-list-row">
                                        <span className="mobile-list-label">Stock mín.</span>
                                        <span className="mobile-list-value">{p.stockminimo ?? '—'}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                        <Button label="Entrada" icon="pi pi-arrow-down" className="p-button-sm p-button-success p-button-outlined" style={{ flex: 1 }} onClick={() => abrirEntrada(p)} />
                                        <Button label="Ajustar" icon="pi pi-pencil" className="p-button-sm p-button-outlined" style={{ flex: 1 }} onClick={() => abrirAjuste(p)} />
                                    </div>
                                </div>
                            ))}
                            {productosFiltrados.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>Sin productos</p>}
                        </div>
                    ) : (
                        <div className="card">
                            <DataTable value={productosFiltrados} dataKey="idproducto" paginator rows={15}
                                loading={loadingProd} rowClassName={p => ({ 'stock-low-row': p.stockBajo })}>
                                <Column field="idproducto" header="ID" style={{ width: 60 }} />
                                <Column field="nombreproducto" header="Producto" sortable />
                                <Column field="categoriaNombre" header="Categoría" />
                                <Column field="codigobarras" header="Código" />
                                <Column header="Stock" body={stockTag} sortable field="stock" />
                                <Column field="stockminimo" header="Mín." style={{ width: 70 }} />
                                <Column field="precioventa" header="P. Venta" body={p => fmtCurrency(p.precioventa)} />
                                <Column header="Acciones" body={actions} style={{ width: 200 }} />
                            </DataTable>
                        </div>
                    )}
                </TabPanel>

                <TabPanel header="Historial de movimientos">
                    <div className="card">
                        <DataTable value={movimientos} dataKey="idmovimiento" paginator rows={20}
                            loading={loadingMov} emptyMessage="Sin movimientos registrados">
                            <Column field="idmovimiento" header="ID" style={{ width: 70 }} />
                            <Column field="nombreproducto" header="Producto" sortable />
                            <Column header="Tipo" body={tipoTag} style={{ width: 100 }} />
                            <Column field="cantidad" header="Cant." style={{ width: 70 }} />
                            <Column field="stockanterior" header="Stock ant." style={{ width: 90 }} />
                            <Column field="stocknuevo" header="Stock nuevo" style={{ width: 100 }} />
                            <Column field="referencia" header="Referencia" />
                            <Column field="observaciones" header="Observaciones" />
                            <Column field="fecha" header="Fecha" sortable body={m => m.fecha ? String(m.fecha).replace('T', ' ').slice(0, 16) : '—'} />
                        </DataTable>
                    </div>
                </TabPanel>
            </TabView>

            <Dialog
                header={dialogTipo === 'entrada' ? `Entrada de stock — ${productoSel?.nombreproducto}` : `Ajustar stock — ${productoSel?.nombreproducto}`}
                visible={dialogVisible}
                style={{ width: '420px' }}
                modal
                onHide={() => setDialogVisible(false)}
                footer={
                    <div>
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => setDialogVisible(false)} />
                        <Button label="Guardar" icon="pi pi-check" loading={saving} onClick={guardar} />
                    </div>
                }
            >
                {productoSel && (
                    <div className="p-fluid">
                        <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, display: 'flex', gap: 16 }}>
                            <div><span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>STOCK ACTUAL</span><br /><strong style={{ fontSize: 20 }}>{productoSel.stock}</strong></div>
                            {dialogTipo === 'entrada' && cantidad > 0 && (
                                <div><span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>NUEVO STOCK</span><br /><strong style={{ fontSize: 20, color: '#22c55e' }}>{productoSel.stock + cantidad}</strong></div>
                            )}
                            {dialogTipo === 'ajuste' && (
                                <div><span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>NUEVO STOCK</span><br /><strong style={{ fontSize: 20, color: '#3b82f6' }}>{cantidad}</strong></div>
                            )}
                        </div>

                        <div className="p-field">
                            <label>{dialogTipo === 'entrada' ? 'Cantidad a ingresar' : 'Nuevo stock total'}</label>
                            <InputNumber value={cantidad} onValueChange={e => setCantidad(e.value || 0)} min={0} showButtons autoFocus />
                        </div>

                        {dialogTipo === 'entrada' && (
                            <div className="p-field">
                                <label>Referencia (factura proveedor, etc.)</label>
                                <InputText value={referencia} onChange={e => setReferencia(e.target.value)} placeholder="Ej: FACT-001" />
                            </div>
                        )}

                        <div className="p-field">
                            <label>Observaciones</label>
                            <InputText value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Opcional" />
                        </div>
                    </div>
                )}
            </Dialog>

            <style>{`
                .stock-low-row td { background: #fffbeb !important; }
                .dark-mode .stock-low-row td { background: rgba(245,158,11,0.1) !important; }
            `}</style>
        </div>
    );
};
