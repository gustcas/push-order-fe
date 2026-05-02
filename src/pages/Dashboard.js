import React, { useEffect, useState, useRef } from 'react';
import { observer } from 'mobx-react';
import { useHistory } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Chart } from 'primereact/chart';
import { ProgressBar } from 'primereact/progressbar';
import { useToast } from '../components/shared/ToastContext';
import axiosInstance from '../middleware/api/axiosInstance';
import { DASHBOARD_ENDPOINTS } from '../middleware/endpoint/ApiRestEndpoint';

const MetricCard = ({ icon, label, value, accent, subtitle }) => (
  <div className="p-col-12 p-md-6 p-lg-3">
    <div
      className="pos-metric-card"
      style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
      }}
    >
      <div
        style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: accent + '22',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <i className={`pi ${icon}`} style={{ fontSize: '1.4rem', color: accent }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            color: 'var(--text-color-secondary, #64748b)',
            letterSpacing: '0.05em',
            fontWeight: 600,
            marginBottom: '0.25rem',
          }}
        >
          {label}
        </div>
        <div style={{ fontSize: '1.75rem', fontWeight: 700, lineHeight: 1 }}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-color-secondary, #94a3b8)', marginTop: '0.25rem' }}>
            {subtitle}
          </div>
        )}
      </div>
    </div>
  </div>
);

const SkeletonCard = () => (
  <div className="p-col-12 p-md-6 p-lg-3">
    <div
      style={{
        background: 'var(--card-bg, #fff)',
        borderRadius: '12px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        padding: '1.5rem',
        height: '90px',
      }}
    >
      <ProgressBar mode="indeterminate" style={{ height: '4px' }} />
    </div>
  </div>
);

const Dashboard = observer(() => {
  const history = useHistory();
  const toast = useToast();
  const [metricas, setMetricas] = useState(null);
  const [loading, setLoading] = useState(true);
  const alertShown = useRef(false);

  useEffect(() => {
    cargarMetricas();
  }, []);

  async function cargarMetricas() {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(DASHBOARD_ENDPOINTS.metricas);
      setMetricas(data);
      if (!alertShown.current && data?.productosStockBajo > 0) {
        alertShown.current = true;
        toast?.warn(
          'Stock Bajo',
          `${data.productosStockBajo} producto(s) con stock bajo`
        );
      }
    } catch {
      setMetricas({
        ventasHoy: 0,
        ordenesHoy: 0,
        productosStockBajo: 0,
        clientesActivos: 0,
        ventasMes: 0,
        cajaAbierta: false,
        montoInicial: 0,
        ventasPorDia: [],
        topProductos: [],
      });
    } finally {
      setLoading(false);
    }
  }

  const chartData = {
    labels: metricas?.ventasPorDia?.map((v) => v.fecha) || [],
    datasets: [
      {
        label: 'Ventas ($)',
        data: metricas?.ventasPorDia?.map((v) => v.total) || [],
        backgroundColor: '#3b82f680',
        borderColor: '#3b82f6',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { callback: (v) => '$' + v } },
    },
  };

  const today = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ padding: '1rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>
            Panel de Control
          </h2>
          <p style={{ margin: 0, color: 'var(--text-color-secondary, #64748b)', fontSize: '0.85rem', textTransform: 'capitalize' }}>
            {today}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <Button
            label="Nueva Venta"
            icon="pi pi-plus"
            className="p-button-success"
            onClick={() => history.push('/orden')}
          />
          <Button
            label="Reporte Diario"
            icon="pi pi-file-pdf"
            className="p-button-secondary p-button-outlined"
            onClick={() => history.push('/reportes')}
          />
        </div>
      </div>

      <div className="p-grid">
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              icon="pi-dollar"
              label="Ventas Hoy"
              value={`$${(metricas?.ventasHoy || 0).toFixed(2)}`}
              accent="#22c55e"
            />
            <MetricCard
              icon="pi-shopping-cart"
              label="Órdenes Hoy"
              value={metricas?.ordenesHoy || 0}
              accent="#3b82f6"
            />
            <MetricCard
              icon="pi-exclamation-triangle"
              label="Stock Bajo"
              value={metricas?.productosStockBajo || 0}
              accent="#f59e0b"
              subtitle="productos"
            />
            <MetricCard
              icon="pi-users"
              label="Clientes Activos"
              value={metricas?.clientesActivos || 0}
              accent="#a855f7"
            />
          </>
        )}
      </div>

      <div className="p-grid" style={{ marginTop: '0.5rem' }}>
        <div className="p-col-12 p-md-6">
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-color-secondary, #64748b)', fontWeight: 600 }}>
              Ventas del Mes
            </div>
            <div style={{ fontSize: '2rem', fontWeight: 700, marginTop: '0.25rem' }}>
              {loading ? '...' : `$${(metricas?.ventasMes || 0).toFixed(2)}`}
            </div>
          </div>
        </div>
        <div className="p-col-12 p-md-6">
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
            }}
          >
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-color-secondary, #64748b)', fontWeight: 600 }}>
              Caja
            </div>
            {loading ? (
              <div>...</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                  <span
                    style={{
                      background: metricas?.cajaAbierta ? '#dcfce7' : '#fee2e2',
                      color: metricas?.cajaAbierta ? '#16a34a' : '#dc2626',
                      borderRadius: '999px',
                      padding: '0.2rem 0.75rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                    }}
                  >
                    {metricas?.cajaAbierta ? 'Abierta' : 'Cerrada'}
                  </span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>
                    ${(metricas?.montoInicial || 0).toFixed(2)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="p-grid" style={{ marginTop: '0.5rem' }}>
        <div className="p-col-12 p-lg-7">
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 600 }}>
              Ventas últimos 7 días
            </h3>
            {loading ? (
              <ProgressBar mode="indeterminate" style={{ height: '4px' }} />
            ) : (
              <Chart type="bar" data={chartData} options={chartOptions} />
            )}
          </div>
        </div>

        <div className="p-col-12 p-lg-5">
          <div
            style={{
              background: 'var(--card-bg, #fff)',
              borderRadius: '12px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              padding: '1.5rem',
            }}
          >
            <h3 style={{ marginTop: 0, fontSize: '1rem', fontWeight: 600 }}>
              Top 5 Productos
            </h3>
            {loading ? (
              <ProgressBar mode="indeterminate" style={{ height: '4px' }} />
            ) : (
              <DataTable value={metricas?.topProductos || []} dataKey="idproducto" size="small">
                <Column field="nombreproducto" header="Producto" />
                <Column
                  field="totalVendido"
                  header="Vendido"
                  body={(r) => `$${(r.totalVendido || 0).toFixed(2)}`}
                />
              </DataTable>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default Dashboard;
