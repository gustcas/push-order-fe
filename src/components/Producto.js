import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog';
import { Tag } from 'primereact/tag';
import axiosInstance from '../middleware/api/axiosInstance';
import { PRODUCTO_ENDPOINTS, CATEGORIA_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

const emptyForm = {
    nombreproducto: '', precioventa: 0, preciocompra: 0,
    stock: 0, stockminimo: 0, idcategoria: null,
    descripcion: '', codigobarras: '', unidadmedida: ''
};

export const Producto = () => {
    const toast = useRef(null);
    const [productos, setProductos] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [dialogVisible, setDialogVisible] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({ ...emptyForm });
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        loadProductos();
        loadCategorias();
        const onResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const loadProductos = async () => {
        try {
            const { data } = await axiosInstance.get(PRODUCTO_ENDPOINTS.listar);
            setProductos(Array.isArray(data) ? data : []);
        } catch {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los productos', life: 3000 });
        }
    };

    const loadCategorias = async () => {
        try {
            const { data } = await axiosInstance.get(CATEGORIA_ENDPOINTS.listar);
            setCategorias(Array.isArray(data) ? data : []);
        } catch {}
    };

    const openNew = () => {
        setForm({ ...emptyForm });
        setEditingId(null);
        setDialogVisible(true);
    };

    const openEdit = (p) => {
        setForm({
            nombreproducto: p.nombreproducto || '',
            precioventa: p.precioventa || 0,
            preciocompra: p.preciocompra || 0,
            stock: p.stock || 0,
            stockminimo: p.stockminimo || 0,
            idcategoria: p.idcategoria || null,
            descripcion: p.descripcion || '',
            codigobarras: p.codigobarras || '',
            unidadmedida: p.unidadmedida || ''
        });
        setEditingId(p.idproducto);
        setDialogVisible(true);
    };

    const handleSave = async () => {
        if (!form.nombreproducto.trim()) {
            toast.current?.show({ severity: 'warn', summary: 'Requerido', detail: 'Ingrese el nombre del producto', life: 3000 });
            return;
        }
        setLoading(true);
        try {
            if (editingId) {
                await axiosInstance.put(PRODUCTO_ENDPOINTS.actualizar(editingId), form);
                toast.current?.show({ severity: 'success', summary: 'Actualizado', detail: 'Producto actualizado', life: 3000 });
            } else {
                await axiosInstance.post(PRODUCTO_ENDPOINTS.crear, form);
                toast.current?.show({ severity: 'success', summary: 'Creado', detail: 'Producto creado', life: 3000 });
            }
            setDialogVisible(false);
            loadProductos();
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'Error al guardar', life: 3000 });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (p) => {
        confirmDialog({
            message: `¿Desactivar el producto "${p.nombreproducto}"?`,
            header: 'Confirmar',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí',
            rejectLabel: 'No',
            accept: async () => {
                try {
                    await axiosInstance.delete(PRODUCTO_ENDPOINTS.eliminar(p.idproducto));
                    toast.current?.show({ severity: 'success', summary: 'Desactivado', detail: 'Producto desactivado', life: 3000 });
                    loadProductos();
                } catch {
                    toast.current?.show({ severity: 'error', summary: 'Error', detail: 'No se pudo desactivar', life: 3000 });
                }
            }
        });
    };

    const fmtCurrency = (v) => Number(v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

    const stockTag = (p) => (
        p.stockBajo
            ? <Tag severity="danger" value={`${p.stock} ⚠`} />
            : <Tag severity="success" value={String(p.stock)} />
    );

    const catNombre = (p) => p.categoriaNombre || (categorias.find(c => c.idcategoria === p.idcategoria)?.nombre) || '—';

    const actions = (p) => (
        <div style={{ display: 'flex', gap: 4 }}>
            <Button icon="pi pi-pencil" className="p-button-sm p-button-text" onClick={() => openEdit(p)} />
            <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => handleDelete(p)} />
        </div>
    );

    return (
        <div>
            <Toast ref={toast} />
            <ConfirmDialog />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <h2 className="pos-page-title" style={{ margin: 0 }}>Productos</h2>
                <Button label="Nuevo" icon="pi pi-plus" className="p-button-sm" onClick={openNew} />
            </div>

            {isMobile ? (
                <div>
                    {productos.map(p => (
                        <div key={p.idproducto} className="mobile-list-card" style={p.stockBajo ? { borderLeft: '3px solid #ef4444' } : {}}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span className="mobile-list-card-title" style={{ margin: 0 }}>{p.nombreproducto}</span>
                                {stockTag(p)}
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Precio</span>
                                <span className="mobile-list-value">{fmtCurrency(p.precioventa)}</span>
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Categoría</span>
                                <span className="mobile-list-value">{catNombre(p)}</span>
                            </div>
                            <div className="mobile-list-row">
                                <span className="mobile-list-label">Código</span>
                                <span className="mobile-list-value">{p.codigobarras || '—'}</span>
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                                <Button icon="pi pi-pencil" label="Editar" className="p-button-sm p-button-outlined" style={{ flex: 1 }} onClick={() => openEdit(p)} />
                                <Button icon="pi pi-trash" label="Eliminar" className="p-button-sm p-button-outlined p-button-danger" style={{ flex: 1 }} onClick={() => handleDelete(p)} />
                            </div>
                        </div>
                    ))}
                    {productos.length === 0 && <p style={{ textAlign: 'center', color: '#94a3b8', marginTop: 32 }}>Sin productos</p>}
                </div>
            ) : (
                <div className="card">
                    <DataTable value={productos} dataKey="idproducto" paginator rows={10}
                        rowClassName={p => ({ 'stock-low-row': p.stockBajo })}>
                        <Column field="idproducto" header="ID" style={{ width: 60 }} />
                        <Column field="nombreproducto" header="Nombre" sortable />
                        <Column field="precioventa" header="P. Venta" body={p => fmtCurrency(p.precioventa)} sortable />
                        <Column field="preciocompra" header="P. Compra" body={p => fmtCurrency(p.preciocompra)} />
                        <Column field="stock" header="Stock" body={stockTag} sortable />
                        <Column header="Categoría" body={catNombre} />
                        <Column field="codigobarras" header="Código" />
                        <Column header="Acciones" body={actions} style={{ width: 90 }} />
                    </DataTable>
                </div>
            )}

            <Dialog
                header={editingId ? 'Editar Producto' : 'Nuevo Producto'}
                visible={dialogVisible}
                style={{ width: '480px' }}
                modal
                onHide={() => setDialogVisible(false)}
                footer={
                    <div>
                        <Button label="Cancelar" icon="pi pi-times" className="p-button-text" onClick={() => setDialogVisible(false)} />
                        <Button label="Guardar" icon="pi pi-check" loading={loading} onClick={handleSave} />
                    </div>
                }
            >
                <div className="p-fluid p-formgrid p-grid">
                    <div className="p-field p-col-12">
                        <label>Nombre *</label>
                        <InputText value={form.nombreproducto} onChange={e => setForm({ ...form, nombreproducto: e.target.value })} autoFocus />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Precio Venta</label>
                        <InputNumber value={form.precioventa} onValueChange={e => setForm({ ...form, precioventa: e.value })} mode="currency" currency="USD" locale="es-EC" min={0} />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Precio Compra</label>
                        <InputNumber value={form.preciocompra} onValueChange={e => setForm({ ...form, preciocompra: e.value })} mode="currency" currency="USD" locale="es-EC" min={0} />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Stock Inicial</label>
                        <InputNumber value={form.stock} onValueChange={e => setForm({ ...form, stock: e.value })} min={0} />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Stock Mínimo</label>
                        <InputNumber value={form.stockminimo} onValueChange={e => setForm({ ...form, stockminimo: e.value })} min={0} />
                    </div>
                    <div className="p-field p-col-12">
                        <label>Categoría</label>
                        <Dropdown
                            value={form.idcategoria}
                            options={categorias}
                            onChange={e => setForm({ ...form, idcategoria: e.value })}
                            optionLabel="nombre"
                            optionValue="idcategoria"
                            placeholder="Seleccione una categoría..."
                            showClear
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Código de Barras</label>
                        <InputText value={form.codigobarras} onChange={e => setForm({ ...form, codigobarras: e.target.value })} />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Unidad de Medida</label>
                        <InputText value={form.unidadmedida} onChange={e => setForm({ ...form, unidadmedida: e.target.value })} placeholder="Ej: UND, KG, L" />
                    </div>
                    <div className="p-field p-col-12">
                        <label>Descripción</label>
                        <InputText value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} />
                    </div>
                </div>
            </Dialog>

            <style>{`
                .stock-low-row td { background: #fff3cd !important; }
                .dark-mode .stock-low-row td { background: rgba(239,68,68,0.12) !important; }
            `}</style>
        </div>
    );
};
