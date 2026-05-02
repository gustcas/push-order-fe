import React, { useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { Button } from 'primereact/button';
import { Calendar } from 'primereact/calendar';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Chart } from 'primereact/chart';
import { Tag } from 'primereact/tag';
import { TabView, TabPanel } from 'primereact/tabview';
import axiosInstance from '../middleware/api/axiosInstance';
import { REPORTE_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

export const Reportes = observer(() => {
    const toast = useRef(null);

    // Ventas
    const [desde, setDesde] = useState(null);
    const [hasta, setHasta] = useState(null);
    const [reporte, setReporte] = useState(null);
    const [loadingVentas, setLoadingVentas] = useState(false);

    // Inventario
    const [inventario, setInventario] = useState(null);
    const [loadingInv, setLoadingInv] = useState(false);

    // Movimientos
    const [movDesde, setMovDesde] = useState(null);
    const [movHasta, setMovHasta] = useState(null);
    const [movimientos, setMovimientos] = useState(null);
    const [loadingMov, setLoadingMov] = useState(false);

    const showToast = (t, s, d) => toast.current?.show({ severity: t, summary: s, detail: d, life: 3000 });

    const fmtCurrency = (v) => Number(v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

    // ── VENTAS ──────────────────────────────────────────────────────────────
    const generarVentas = async () => {
        setLoadingVentas(true);
        try {
            const params = {};
            if (desde) params.desde = desde.toISOString().split('T')[0];
            if (hasta) params.hasta = hasta.toISOString().split('T')[0];
            const { data } = await axiosInstance.get(REPORTE_ENDPOINTS.ventas, { params });
            setReporte(data);
        } catch {
            showToast('error', 'Error', 'No se pudo generar el reporte de ventas');
        } finally {
            setLoadingVentas(false);
        }
    };

    const exportarCSVVentas = () => {
        if (!reporte?.ordenes?.length) return;
        const headers = ['Factura', 'Fecha', 'Cliente', 'Subtotal', 'IVA', 'Descuento', 'Total', 'Estado'];
        const rows = reporte.ordenes.map(o => [
            o.numerofactura, o.fechacreacionorden, `"${o.nombrecliente}"`,
            o.subtotal, o.totaliva, o.descuento, o.total, o.estado
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        descargarCSV(csv, `ventas-${new Date().toISOString().split('T')[0]}.csv`);
    };

    const chartData = reporte ? {
        labels: (reporte.ordenes || []).map(o => (o.fechacreacionorden || '').slice(0, 10)).filter((v, i, a) => a.indexOf(v) === i),
        datasets: [{
            label: 'Total ($)',
            data: Object.values((reporte.ordenes || []).reduce((acc, o) => {
                const d = (o.fechacreacionorden || '').slice(0, 10);
                acc[d] = (acc[d] || 0) + Number(o.total || 0);
                return acc;
            }, {})),
            backgroundColor: '#f69f4388',
            borderColor: '#f69f43',
            borderWidth: 2,
            borderRadius: 6,
        }]
    } : null;

    // ── INVENTARIO ──────────────────────────────────────────────────────────
    const cargarInventario = async () => {
        setLoadingInv(true);
        try {
            const { data } = await axiosInstance.get(REPORTE_ENDPOINTS.inventario);
            setInventario(Array.isArray(data) ? data : []);
        } catch {
            showToast('error', 'Error', 'No se pudo cargar el inventario');
        } finally {
            setLoadingInv(false);
        }
    };

    const exportarCSVInventario = () => {
        if (!inventario?.length) return;
        const headers = ['ID', 'Producto', 'Categoría', 'Stock', 'Stock Mín.', 'P. Venta', 'P. Compra', 'Estado'];
        const rows = inventario.map(p => [
            p.idproducto, `"${p.nombreproducto}"`, `"${p.categoriaNombre || ''}"`,
            p.stock, p.stockminimo, p.precioventa, p.preciocompra, p.estado
        ]);
        descargarCSV([headers, ...rows].map(r => r.join(',')).join('\n'),
            `inventario-${new Date().toISOString().split('T')[0]}.csv`);
    };

    // ── MOVIMIENTOS ─────────────────────────────────────────────────────────
    const cargarMovimientos = async () => {
        setLoadingMov(true);
        try {
            const params = {};
            if (movDesde) params.desde = movDesde.toISOString().split('T')[0];
            if (movHasta) params.hasta = movHasta.toISOString().split('T')[0];
            const { data } = await axiosInstance.get(REPORTE_ENDPOINTS.movimientos, { params });
            setMovimientos(Array.isArray(data) ? data : []);
        } catch {
            showToast('error', 'Error', 'No se pudo cargar los movimientos');
        } finally {
            setLoadingMov(false);
        }
    };

    const exportarCSVMovimientos = () => {
        if (!movimientos?.length) return;
        const headers = ['ID', 'Producto', 'Tipo', 'Cantidad', 'Stock ant.', 'Stock nuevo', 'Referencia', 'Fecha'];
        const rows = movimientos.map(m => [
            m.idmovimiento, `"${m.nombreproducto || ''}"`, m.tipo,
            m.cantidad, m.stockanterior, m.stocknuevo,
            `"${m.referencia || ''}"`, m.fecha
        ]);
        descargarCSV([headers, ...rows].map(r => r.join(',')).join('\n'),
            `movimientos-${new Date().toISOString().split('T')[0]}.csv`);
    };

    // ── UTILS ───────────────────────────────────────────────────────────────
    const descargarCSV = (csv, nombre) => {
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = nombre; a.click();
        URL.revokeObjectURL(url);
    };

    const estadoTag = (o) => <Tag value={o.estado === 'A' ? 'Activa' : 'Cancelada'} severity={o.estado === 'A' ? 'success' : 'danger'} />;

    const tipoTag = (m) => {
        const map = { 'S': ['Venta', 'danger'], 'E': ['Entrada', 'success'], 'A': ['Ajuste', 'info'] };
        const [label, sev] = map[m.tipo] || [m.tipo, 'secondary'];
        return <Tag value={label} severity={sev} />;
    };

    return (
        <div>
            <Toast ref={toast} />

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="pos-page-title" style={{ margin: 0 }}>Reportes</h2>
                <p className="pos-page-subtitle">Análisis de ventas, inventario y movimientos</p>
            </div>

            <TabView>
                {/* ── VENTAS ── */}
                <TabPanel header="Ventas">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem' }}>Desde</label>
                                <Calendar value={desde} onChange={e => setDesde(e.value)} dateFormat="yy-mm-dd" showIcon placeholder="Fecha inicio" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem' }}>Hasta</label>
                                <Calendar value={hasta} onChange={e => setHasta(e.value)} dateFormat="yy-mm-dd" showIcon placeholder="Fecha fin" />
                            </div>
                            <Button label="Generar" icon="pi pi-chart-bar" onClick={generarVentas} loading={loadingVentas} />
                            {reporte && <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-success" onClick={exportarCSVVentas} />}
                        </div>
                    </div>

                    {reporte && (
                        <>
                            <div className="p-grid" style={{ marginBottom: '1rem' }}>
                                {[
                                    { label: 'Total Ventas', value: fmtCurrency(reporte.totalVentas), icon: 'pi-dollar', bg: '#f0fdf4', color: '#22c55e' },
                                    { label: 'Órdenes', value: reporte.cantidadOrdenes || 0, icon: 'pi-list', bg: '#eff6ff', color: '#1976d2' },
                                    { label: 'Ticket Promedio', value: fmtCurrency(reporte.ticketPromedio), icon: 'pi-chart-line', bg: '#fffbeb', color: '#f59e0b' },
                                ].map(m => (
                                    <div key={m.label} className="p-col-12 p-md-4">
                                        <div className="metric-card">
                                            <div className="metric-icon-wrap" style={{ background: m.bg }}>
                                                <i className={`pi ${m.icon}`} style={{ color: m.color }} />
                                            </div>
                                            <div className="metric-value">{m.value}</div>
                                            <div className="metric-label">{m.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {chartData && reporte.ordenes?.length > 0 && (
                                <div className="card" style={{ marginBottom: 16 }}>
                                    <h5 style={{ margin: '0 0 12px' }}>Ventas por día</h5>
                                    <Chart type="bar" data={chartData}
                                        options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { callback: v => '$' + v } } } }} />
                                </div>
                            )}

                            <div className="card">
                                <h5 style={{ margin: '0 0 12px' }}>Detalle de órdenes</h5>
                                <DataTable value={reporte.ordenes || []} paginator rows={15} emptyMessage="Sin órdenes">
                                    <Column field="numerofactura" header="Factura" />
                                    <Column field="fechacreacionorden" header="Fecha" />
                                    <Column field="nombrecliente" header="Cliente" />
                                    <Column field="subtotal" header="Subtotal" body={r => fmtCurrency(r.subtotal)} />
                                    <Column field="totaliva" header="IVA" body={r => fmtCurrency(r.totaliva)} />
                                    <Column field="total" header="Total" body={r => <strong>{fmtCurrency(r.total)}</strong>} />
                                    <Column header="Estado" body={estadoTag} />
                                </DataTable>
                            </div>
                        </>
                    )}
                </TabPanel>

                {/* ── INVENTARIO ── */}
                <TabPanel header="Inventario">
                    <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                        <Button label="Cargar inventario" icon="pi pi-refresh" onClick={cargarInventario} loading={loadingInv} />
                        {inventario && <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-success" onClick={exportarCSVInventario} />}
                    </div>

                    {inventario && (
                        <>
                            <div className="p-grid" style={{ marginBottom: 16 }}>
                                {[
                                    { label: 'Total productos', value: inventario.length, icon: 'pi-box', bg: '#eff6ff', color: '#1976d2' },
                                    { label: 'Stock bajo', value: inventario.filter(p => p.stockBajo).length, icon: 'pi-exclamation-triangle', bg: '#fffbeb', color: '#f59e0b' },
                                    { label: 'Sin stock', value: inventario.filter(p => p.stock <= 0).length, icon: 'pi-times-circle', bg: '#fef2f2', color: '#ef4444' },
                                ].map(m => (
                                    <div key={m.label} className="p-col-12 p-md-4">
                                        <div className="metric-card">
                                            <div className="metric-icon-wrap" style={{ background: m.bg }}>
                                                <i className={`pi ${m.icon}`} style={{ color: m.color }} />
                                            </div>
                                            <div className="metric-value">{m.value}</div>
                                            <div className="metric-label">{m.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="card">
                                <DataTable value={inventario} dataKey="idproducto" paginator rows={20}
                                    rowClassName={p => ({ 'stock-low-row': p.stockBajo })}>
                                    <Column field="idproducto" header="ID" style={{ width: 60 }} />
                                    <Column field="nombreproducto" header="Producto" sortable />
                                    <Column field="categoriaNombre" header="Categoría" />
                                    <Column field="stock" header="Stock" sortable body={p => (
                                        p.stock <= 0 ? <Tag severity="danger" value="Sin stock" />
                                            : p.stockBajo ? <Tag severity="warning" value={`${p.stock} ⚠`} />
                                                : <Tag severity="success" value={String(p.stock)} />
                                    )} />
                                    <Column field="stockminimo" header="Mín." style={{ width: 70 }} />
                                    <Column field="precioventa" header="P. Venta" body={p => fmtCurrency(p.precioventa)} />
                                    <Column field="preciocompra" header="P. Compra" body={p => fmtCurrency(p.preciocompra)} />
                                </DataTable>
                            </div>
                        </>
                    )}
                </TabPanel>

                {/* ── MOVIMIENTOS ── */}
                <TabPanel header="Movimientos">
                    <div className="card" style={{ marginBottom: 16 }}>
                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem' }}>Desde</label>
                                <Calendar value={movDesde} onChange={e => setMovDesde(e.value)} dateFormat="yy-mm-dd" showIcon />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: 4, fontWeight: 600, fontSize: '0.85rem' }}>Hasta</label>
                                <Calendar value={movHasta} onChange={e => setMovHasta(e.value)} dateFormat="yy-mm-dd" showIcon />
                            </div>
                            <Button label="Buscar" icon="pi pi-search" onClick={cargarMovimientos} loading={loadingMov} />
                            {movimientos && <Button label="Exportar CSV" icon="pi pi-download" className="p-button-outlined p-button-success" onClick={exportarCSVMovimientos} />}
                        </div>
                    </div>

                    {movimientos && (
                        <div className="card">
                            <DataTable value={movimientos} dataKey="idmovimiento" paginator rows={20} loading={loadingMov}
                                emptyMessage="Sin movimientos para el período">
                                <Column field="nombreproducto" header="Producto" sortable />
                                <Column header="Tipo" body={tipoTag} style={{ width: 100 }} />
                                <Column field="cantidad" header="Cant." style={{ width: 70 }} />
                                <Column field="stockanterior" header="Ant." style={{ width: 70 }} />
                                <Column field="stocknuevo" header="Nuevo" style={{ width: 80 }} />
                                <Column field="referencia" header="Referencia" />
                                <Column field="observaciones" header="Obs." />
                                <Column field="fecha" header="Fecha" sortable body={m => m.fecha ? String(m.fecha).replace('T', ' ').slice(0, 16) : '—'} />
                            </DataTable>
                        </div>
                    )}
                </TabPanel>
            </TabView>

            <style>{`
                .stock-low-row td { background: #fffbeb !important; }
                .dark-mode .stock-low-row td { background: rgba(245,158,11,0.1) !important; }
            `}</style>
        </div>
    );
});
