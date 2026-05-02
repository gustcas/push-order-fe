import React, { useEffect, useRef, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { Message } from 'primereact/message';
import axiosInstance from '../middleware/api/axiosInstance';
import { PRODUCTO_ENDPOINTS, ORDEN_ENDPOINTS, CLIENTE_ENDPOINTS, CAJA_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

export const Orden = () => {
    const toast = useRef(null);
    const history = useHistory();
    const [productos, setProductos] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [cajaAbierta, setCajaAbierta] = useState(null);

    const [nombrecliente, setNombrecliente] = useState('');
    const [cedulacliente, setCedulacliente] = useState('');
    const [direccioncliente, setDireccioncliente] = useState('');
    const [idcliente, setIdcliente] = useState(null);
    const [idmetodopago, setIdmetodopago] = useState(null);
    const [descuentoOrden, setDescuentoOrden] = useState(0);
    const [observaciones, setObservaciones] = useState('');

    const [productDialog, setProductDialog] = useState(false);
    const [productSearch, setProductSearch] = useState('');
    const [successDialog, setSuccessDialog] = useState(false);
    const [factura, setFactura] = useState(null);
    const [loading, setLoading] = useState(false);
    const [buscandoCliente, setBuscandoCliente] = useState(false);

    useEffect(() => {
        loadProductos();
        loadMetodosPago();
        checkCaja();
    }, []);

    const checkCaja = async () => {
        try {
            const res = await axiosInstance.get(CAJA_ENDPOINTS.activa);
            setCajaAbierta(res.status === 200 && !!res.data);
        } catch {
            setCajaAbierta(false);
        }
    };

    // Buscar cliente automáticamente mientras se escribe la cédula
    useEffect(() => {
        const cedula = cedulacliente.trim();
        if (cedula.length < 8) {
            // Limpiar si el usuario borra la cédula
            if (cedula.length === 0) {
                setNombrecliente('');
                setDireccioncliente('');
                setIdcliente(null);
            }
            return;
        }
        const timer = setTimeout(() => buscarClientePorCedula(cedula), 500);
        return () => clearTimeout(timer);
    }, [cedulacliente]);

    const loadProductos = async () => {
        try {
            const { data } = await axiosInstance.get(PRODUCTO_ENDPOINTS.listar);
            setProductos(Array.isArray(data) ? data : []);
        } catch {}
    };

    const loadMetodosPago = async () => {
        try {
            const { data } = await axiosInstance.get(ORDEN_ENDPOINTS.metodosPago);
            setMetodosPago(Array.isArray(data) ? data : []);
        } catch {}
    };

    const buscarClientePorCedula = async (cedula) => {
        const c = (cedula || cedulacliente).trim();
        if (!c) return;
        setBuscandoCliente(true);
        try {
            const { data } = await axiosInstance.get(CLIENTE_ENDPOINTS.buscarCedula(c));
            if (data) {
                const nombre = [data.nombres, data.apellidos].filter(Boolean).join(' ');
                setNombrecliente(nombre);
                setDireccioncliente(data.direccion || '');
                setIdcliente(data.idcliente);
                toast.current?.show({ severity: 'success', summary: 'Cliente encontrado', detail: nombre, life: 2000 });
            }
        } catch {
            // No mostrar error si fue búsqueda automática (silencioso)
            if (!cedula) {
                toast.current?.show({ severity: 'info', summary: 'No encontrado', detail: 'Cliente no registrado, puede continuar', life: 2500 });
            }
        } finally {
            setBuscandoCliente(false);
        }
    };

    const filteredProductos = productos.filter(p => {
        if (!productSearch) return true;
        const q = productSearch.toLowerCase();
        return p.nombreproducto?.toLowerCase().includes(q) || p.codigobarras?.includes(productSearch);
    });

    const addToCart = (producto) => {
        if (producto.stock <= 0) {
            toast.current?.show({ severity: 'warn', summary: 'Sin stock', detail: `${producto.nombreproducto} no tiene stock disponible`, life: 3000 });
            return;
        }
        const existing = carrito.find(c => c.idproducto === producto.idproducto);
        if (existing) {
            if (existing.cantidad >= producto.stock) {
                toast.current?.show({ severity: 'warn', summary: 'Stock insuficiente', detail: `Stock disponible: ${producto.stock}`, life: 3000 });
                return;
            }
            setCarrito(carrito.map(c =>
                c.idproducto === producto.idproducto ? { ...c, cantidad: c.cantidad + 1 } : c
            ));
        } else {
            setCarrito([...carrito, {
                idproducto: producto.idproducto,
                nombreproducto: producto.nombreproducto,
                precioventa: producto.precioventa,
                stock: producto.stock,
                cantidad: 1,
                descuento: 0
            }]);
        }
        setProductDialog(false);
        setProductSearch('');
    };

    const updateCantidad = (idproducto, cantidad) => {
        if (!cantidad || cantidad <= 0) {
            setCarrito(carrito.filter(c => c.idproducto !== idproducto));
        } else {
            setCarrito(carrito.map(c => c.idproducto === idproducto ? { ...c, cantidad } : c));
        }
    };

    const updateDescuento = (idproducto, descuento) => {
        setCarrito(carrito.map(c => c.idproducto === idproducto ? { ...c, descuento: descuento || 0 } : c));
    };

    const removeFromCart = (idproducto) => {
        setCarrito(carrito.filter(c => c.idproducto !== idproducto));
    };

    const calcLinea = (item) => {
        const factorDesc = 1 - (item.descuento || 0) / 100;
        const subtotal = Number(item.precioventa) * item.cantidad * factorDesc;
        const iva = subtotal * 0.12;
        return { subtotal, iva, total: subtotal + iva };
    };

    const totales = carrito.reduce((acc, item) => {
        const { subtotal, iva, total } = calcLinea(item);
        return { subtotal: acc.subtotal + subtotal, iva: acc.iva + iva, total: acc.total + total };
    }, { subtotal: 0, iva: 0, total: 0 });

    const totalFinal = totales.total - (descuentoOrden || 0);

    const fmtCurrency = (v) => Number(v || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

    const imprimirFactura = (f) => {
        if (!f) return;
        const lineas = (f.detalles || []).map(d =>
            `<tr><td>${d.nombreproducto}</td><td style="text-align:center">${d.cantidad}</td><td style="text-align:right">$${Number(d.preciounidad || 0).toFixed(2)}</td><td style="text-align:right">$${Number(d.total || 0).toFixed(2)}</td></tr>`
        ).join('');
        const win = window.open('', '_blank', 'width=400,height=600');
        win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Factura ${f.numerofactura}</title>
        <style>body{font-family:monospace;font-size:12px;padding:16px;max-width:380px;margin:0 auto}
        h2{text-align:center;margin:0 0 4px}p{margin:2px 0}hr{border:1px dashed #ccc}
        table{width:100%;border-collapse:collapse}th,td{padding:3px 2px}th{border-bottom:1px solid #000}
        .total{font-size:14px;font-weight:bold}.right{text-align:right}
        @media print{body{padding:0}}</style></head><body>
        <h2>EDIMCA POS</h2>
        <p style="text-align:center"><strong>${f.numerofactura}</strong></p>
        <hr>
        <p>Cliente: ${f.nombrecliente}</p>
        <p>Cédula: ${f.cedulacliente || '—'}</p>
        <p>Fecha: ${f.fechacreacionorden || new Date().toLocaleString('es-EC')}</p>
        <p>Pago: ${f.metodoPagoNombre || '—'}</p>
        <hr>
        <table><thead><tr><th>Producto</th><th>Cant</th><th class="right">P.U.</th><th class="right">Total</th></tr></thead>
        <tbody>${lineas}</tbody></table>
        <hr>
        <p class="right">Subtotal: $${Number(f.subtotal || 0).toFixed(2)}</p>
        <p class="right">IVA 12%: $${Number(f.totaliva || 0).toFixed(2)}</p>
        ${f.descuento > 0 ? `<p class="right">Descuento: -$${Number(f.descuento).toFixed(2)}</p>` : ''}
        <p class="right total">TOTAL: $${Number(f.total || 0).toFixed(2)}</p>
        <hr><p style="text-align:center;font-size:10px">Gracias por su compra</p>
        <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close();}<\/script>
        </body></html>`);
        win.document.close();
    };

    const handleSubmit = async () => {
        if (!carrito.length) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Agregue al menos un producto', life: 3000 });
            return;
        }
        if (!idmetodopago) {
            toast.current?.show({ severity: 'warn', summary: 'Atención', detail: 'Seleccione el método de pago', life: 3000 });
            return;
        }
        setLoading(true);
        try {
            const payload = {
                nombrecliente: nombrecliente.trim() || 'CONSUMIDOR FINAL',
                cedulacliente: cedulacliente.trim() || null,
                direccioncliente: direccioncliente.trim() || null,
                idcliente: idcliente || null,
                idmetodopago,
                descuento: descuentoOrden || 0,
                observaciones: observaciones.trim() || null,
                detalles: carrito.map(c => ({
                    idproducto: c.idproducto,
                    cantidad: c.cantidad,
                    descuento: c.descuento || 0
                }))
            };
            const { data } = await axiosInstance.post(ORDEN_ENDPOINTS.crear, payload);
            setFactura(data);
            setSuccessDialog(true);
            setCarrito([]);
            setNombrecliente('');
            setCedulacliente('');
            setDireccioncliente('');
            setIdcliente(null);
            setIdmetodopago(null);
            setDescuentoOrden(0);
            setObservaciones('');
        } catch (e) {
            toast.current?.show({ severity: 'error', summary: 'Error', detail: e.response?.data?.message || 'No se pudo crear la orden', life: 4000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <Toast ref={toast} />

            <div style={{ marginBottom: '1.5rem' }}>
                <h2 className="pos-page-title" style={{ margin: 0 }}>Nueva Venta</h2>
            </div>

            {/* Caja warning */}
            {cajaAbierta === false && (
                <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12, background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8, padding: '12px 16px' }}>
                    <i className="pi pi-exclamation-triangle" style={{ color: '#d97706', fontSize: 20 }} />
                    <span style={{ flex: 1, color: '#92400e', fontWeight: 500 }}>
                        No hay una caja abierta. Debe abrir la caja antes de registrar ventas.
                    </span>
                    <Button
                        label="Ir a Caja"
                        icon="pi pi-wallet"
                        className="p-button-warning p-button-sm"
                        onClick={() => history.push('/caja')}
                    />
                </div>
            )}

            {/* Client + payment */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div className="p-fluid p-formgrid p-grid">
                    <div className="p-field p-col-12 p-md-4">
                        <label>Cédula / RUC</label>
                        <div className="p-inputgroup">
                            <InputText
                                value={cedulacliente}
                                onChange={e => setCedulacliente(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && buscarClientePorCedula()}
                                placeholder="0000000000"
                                maxLength={13}
                            />
                            <Button
                                icon={buscandoCliente ? 'pi pi-spin pi-spinner' : 'pi pi-search'}
                                className="p-button-outlined"
                                tooltip="Buscar cliente"
                                onClick={() => buscarClientePorCedula()}
                                disabled={buscandoCliente}
                            />
                        </div>
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label>Nombre Cliente</label>
                        <InputText value={nombrecliente} onChange={e => setNombrecliente(e.target.value)} placeholder="Consumidor Final" />
                    </div>
                    <div className="p-field p-col-12 p-md-4">
                        <label>Método de Pago *</label>
                        <Dropdown
                            value={idmetodopago}
                            options={metodosPago}
                            onChange={e => setIdmetodopago(e.value)}
                            optionLabel="nombre"
                            optionValue="idmetodopago"
                            placeholder="Seleccione..."
                        />
                    </div>
                    <div className="p-field p-col-12 p-md-6">
                        <label>Dirección</label>
                        <InputText value={direccioncliente} onChange={e => setDireccioncliente(e.target.value)} />
                    </div>
                    <div className="p-field p-col-12 p-md-3">
                        <label>Descuento orden ($)</label>
                        <InputNumber value={descuentoOrden} onValueChange={e => setDescuentoOrden(e.value || 0)} mode="currency" currency="USD" locale="es-EC" min={0} />
                    </div>
                    <div className="p-field p-col-12 p-md-3">
                        <label>Observaciones</label>
                        <InputText value={observaciones} onChange={e => setObservaciones(e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Cart */}
            <div className="card" style={{ marginBottom: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h5 style={{ margin: 0 }}>Productos en la orden</h5>
                    <Button label="Agregar producto" icon="pi pi-plus" className="p-button-sm" onClick={() => { setProductSearch(''); setProductDialog(true); }} />
                </div>
                <DataTable value={carrito} dataKey="idproducto" emptyMessage="No hay productos. Haga clic en 'Agregar producto'.">
                    <Column field="nombreproducto" header="Producto" />
                    <Column header="Precio" style={{ width: 100 }} body={row => fmtCurrency(row.precioventa)} />
                    <Column header="Cantidad" style={{ width: 140 }} body={row => (
                        <InputNumber
                            value={row.cantidad}
                            onValueChange={e => updateCantidad(row.idproducto, e.value)}
                            min={1}
                            max={row.stock}
                            showButtons
                            buttonLayout="horizontal"
                            decrementButtonClassName="p-button-secondary p-button-sm"
                            incrementButtonClassName="p-button-secondary p-button-sm"
                            style={{ width: 110 }}
                        />
                    )} />
                    <Column header="Desc. %" style={{ width: 110 }} body={row => (
                        <InputNumber
                            value={row.descuento}
                            onValueChange={e => updateDescuento(row.idproducto, e.value)}
                            min={0}
                            max={100}
                            suffix="%"
                            style={{ width: 90 }}
                        />
                    )} />
                    <Column header="Subtotal" style={{ width: 100 }} body={row => fmtCurrency(calcLinea(row).subtotal)} />
                    <Column header="IVA" style={{ width: 90 }} body={row => fmtCurrency(calcLinea(row).iva)} />
                    <Column header="Total" style={{ width: 100 }} body={row => <strong>{fmtCurrency(calcLinea(row).total)}</strong>} />
                    <Column style={{ width: 50 }} body={row => (
                        <Button icon="pi pi-trash" className="p-button-sm p-button-text p-button-danger" onClick={() => removeFromCart(row.idproducto)} />
                    )} />
                </DataTable>
            </div>

            {/* Totals */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <div style={{ minWidth: 300 }}>
                        <div className="orden-total-row"><span>Subtotal</span><span>{fmtCurrency(totales.subtotal)}</span></div>
                        <div className="orden-total-row"><span>IVA 12%</span><span>{fmtCurrency(totales.iva)}</span></div>
                        {descuentoOrden > 0 && (
                            <div className="orden-total-row"><span>Descuento general</span><span style={{ color: '#22c55e' }}>- {fmtCurrency(descuentoOrden)}</span></div>
                        )}
                        <div className="orden-total-row orden-total-final">
                            <span>TOTAL</span>
                            <span style={{ color: '#f69f43' }}>{fmtCurrency(totalFinal)}</span>
                        </div>
                        <Button
                            label="Generar Factura"
                            icon="pi pi-receipt"
                            loading={loading}
                            style={{ width: '100%', marginTop: 16, height: 48 }}
                            onClick={handleSubmit}
                            disabled={carrito.length === 0}
                        />
                    </div>
                </div>
            </div>

            {/* Product search dialog */}
            <Dialog
                header="Seleccionar Producto"
                visible={productDialog}
                style={{ width: '520px' }}
                modal
                onHide={() => setProductDialog(false)}
            >
                <div className="p-field" style={{ marginBottom: 12 }}>
                    <InputText
                        value={productSearch}
                        onChange={e => setProductSearch(e.target.value)}
                        placeholder="Buscar por nombre o código de barras..."
                        style={{ width: '100%' }}
                        autoFocus
                    />
                </div>
                <DataTable
                    value={filteredProductos}
                    dataKey="idproducto"
                    paginator
                    rows={8}
                    selectionMode="single"
                    onSelectionChange={e => e.value && addToCart(e.value)}
                    rowClassName={p => ({ 'row-no-stock': p.stock <= 0 })}
                >
                    <Column field="nombreproducto" header="Producto" />
                    <Column field="precioventa" header="Precio" body={p => fmtCurrency(p.precioventa)} style={{ width: 100 }} />
                    <Column field="stock" header="Stock" style={{ width: 80 }} body={p => (
                        p.stock <= 0
                            ? <Tag severity="danger" value="Sin stock" />
                            : p.stockBajo
                                ? <Tag severity="warning" value={String(p.stock)} />
                                : <Tag severity="success" value={String(p.stock)} />
                    )} />
                </DataTable>
            </Dialog>

            {/* Success dialog */}
            <Dialog
                header="Venta registrada exitosamente"
                visible={successDialog}
                style={{ width: '420px' }}
                modal
                onHide={() => setSuccessDialog(false)}
                footer={
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button label="Imprimir" icon="pi pi-print" className="p-button-outlined" onClick={() => imprimirFactura(factura)} />
                        <Button label="Nueva venta" icon="pi pi-plus" onClick={() => setSuccessDialog(false)} />
                    </div>
                }
            >
                {factura && (
                    <div>
                        <div style={{ textAlign: 'center', marginBottom: 16 }}>
                            <div style={{ fontSize: 48, color: '#22c55e' }}>✓</div>
                            <div style={{ fontSize: 22, fontWeight: 800, color: '#f69f43' }}>{factura.numerofactura}</div>
                        </div>
                        <div className="orden-total-row"><span>Cliente</span><span>{factura.nombrecliente}</span></div>
                        <div className="orden-total-row"><span>Método de pago</span><span>{factura.metodoPagoNombre || '—'}</span></div>
                        <div className="orden-total-row"><span>Subtotal</span><span>{fmtCurrency(factura.subtotal)}</span></div>
                        <div className="orden-total-row"><span>IVA 12%</span><span>{fmtCurrency(factura.totaliva)}</span></div>
                        {factura.descuento > 0 && <div className="orden-total-row"><span>Descuento</span><span>- {fmtCurrency(factura.descuento)}</span></div>}
                        <div className="orden-total-row orden-total-final"><span>TOTAL</span><span style={{ color: '#f69f43' }}>{fmtCurrency(factura.total)}</span></div>
                    </div>
                )}
            </Dialog>

            <style>{`
                .orden-total-row { display: flex; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #e2e8f0; }
                .dark-mode .orden-total-row { border-color: #334155; }
                .orden-total-final { font-size: 18px; font-weight: 800; border-top: 2px solid #cbd5e1; border-bottom: none; padding-top: 12px; margin-top: 4px; }
                .dark-mode .orden-total-final { border-color: #475569; }
                .row-no-stock { opacity: 0.45; pointer-events: none; }
            `}</style>
        </div>
    );
};
