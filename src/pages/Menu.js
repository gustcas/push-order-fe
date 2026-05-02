import React, { useState, useRef } from 'react';
import { Route, Switch, useHistory } from 'react-router-dom';
import { observer } from 'mobx-react';
import { useDataStore } from '../data/DataStoreContext';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import '../styles/pos-layout.css';

// POS Components
import Dashboard from './Dashboard';
import { Producto } from '../components/Producto';
import { Orden } from '../components/Orden';
import { ListaOrden } from '../components/ListaOrden';
import Categorias from '../components/Categorias';
import Clientes from '../components/Clientes';
import Caja from '../components/Caja';
import { Configuracion } from './Configuracion';
import { Usuarios } from './Usuarios';
import { Reportes } from './Reportes';
import { Inventario } from '../components/Inventario';

export const Menu = observer(({ setIsLoggedIn }) => {
    const dataStore = useDataStore();
    const history = useHistory();
    const toast = useRef(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const menuItems = [
        { label: 'Dashboard', icon: 'pi pi-home', path: '/' },
        { label: 'Nueva Venta', icon: 'pi pi-shopping-cart', path: '/orden' },
        { label: 'Órdenes', icon: 'pi pi-list', path: '/lista-orden' },
        { label: 'Productos', icon: 'pi pi-box', path: '/productos' },
        { label: 'Categorías', icon: 'pi pi-tags', path: '/categorias' },
        { label: 'Clientes', icon: 'pi pi-users', path: '/clientes' },
        { label: 'Caja', icon: 'pi pi-wallet', path: '/caja' },
        { label: 'Inventario', icon: 'pi pi-warehouse', path: '/inventario' },
        { label: 'Reportes', icon: 'pi pi-chart-bar', path: '/reportes' },
        ...(dataStore.isAdmin ? [{ label: 'Usuarios', icon: 'pi pi-user', path: '/usuarios' }] : []),
        { label: 'Configuración', icon: 'pi pi-cog', path: '/configuracion' },
    ];

    const handleLogout = () => {
        dataStore.logout();
        setIsLoggedIn(false);
        history.push('/');
    };

    const navigate = (path) => {
        history.push(path);
        setMenuOpen(false);
    };

    const initials = dataStore.authUser
        ? dataStore.authUser.substring(0, 2).toUpperCase()
        : 'US';

    return (
        <div className={`pos-layout${dataStore.darkMode ? ' dark-mode' : ''}`}>
            <Toast ref={toast} position="top-right" />

            {/* Sidebar */}
            <div className={`pos-sidebar${menuOpen ? ' open' : ''}`}>
                <div className="pos-sidebar-header">
                    <div className="pos-logo">
                        <span className="pos-logo-text">POS</span>
                        <span className="pos-logo-dot" style={{ color: '#f69f43' }}>.</span>
                    </div>
                    <button className="pos-menu-close" onClick={() => setMenuOpen(false)}>
                        <i className="pi pi-times" />
                    </button>
                </div>

                <div className="pos-user-info">
                    <div className="pos-avatar">{initials}</div>
                    <div>
                        <div className="pos-username">{dataStore.authUser}</div>
                        <span className={`pos-role-badge pos-role-${(dataStore.userRole || '').toLowerCase()}`}>
                            {dataStore.userRole || 'USUARIO'}
                        </span>
                    </div>
                </div>

                <nav className="pos-nav">
                    {menuItems.map((item) => (
                        <div
                            key={item.path}
                            className={`pos-nav-item${history.location.pathname === item.path ? ' active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </div>
                    ))}
                </nav>

                <div className="pos-sidebar-footer">
                    <button className="pos-logout-btn" onClick={handleLogout}>
                        <i className="pi pi-sign-out" />
                        <span>Cerrar sesión</span>
                    </button>
                </div>
            </div>

            {/* Main content */}
            <div className="pos-main">
                <div className="pos-topbar">
                    <button className="pos-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                        <i className="pi pi-bars" />
                    </button>
                    <div className="pos-topbar-right">
                        <button className="pos-dark-toggle" onClick={() => dataStore.setDarkMode(!dataStore.darkMode)}>
                            <i className={dataStore.darkMode ? 'pi pi-sun' : 'pi pi-moon'} />
                        </button>
                        <div className="pos-avatar-sm">{initials}</div>
                    </div>
                </div>

                <div className="pos-content">
                    <Switch>
                        <Route exact path="/" component={Dashboard} />
                        <Route path="/orden" component={Orden} />
                        <Route path="/lista-orden" component={ListaOrden} />
                        <Route path="/productos" component={Producto} />
                        <Route path="/categorias" component={Categorias} />
                        <Route path="/clientes" component={Clientes} />
                        <Route path="/caja" component={Caja} />
                        <Route path="/inventario" component={Inventario} />
                        <Route path="/reportes" component={Reportes} />
                        <Route path="/usuarios" component={Usuarios} />
                        <Route path="/configuracion" component={Configuracion} />
                        <Route component={Dashboard} />
                    </Switch>
                </div>

                {/* Bottom Nav for mobile */}
                <div className="pos-bottom-nav">
                    {[
                        { icon: 'pi pi-home', path: '/', label: 'Inicio' },
                        { icon: 'pi pi-shopping-cart', path: '/orden', label: 'Venta' },
                        { icon: 'pi pi-list', path: '/lista-orden', label: 'Órdenes' },
                        { icon: 'pi pi-box', path: '/productos', label: 'Stock' },
                        { icon: 'pi pi-cog', path: '/configuracion', label: 'Config' },
                    ].map((item) => (
                        <button
                            key={item.path}
                            className={`pos-bottom-nav-item${history.location.pathname === item.path ? ' active' : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <i className={item.icon} />
                            <span>{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overlay for mobile sidebar */}
            {menuOpen && <div className="pos-overlay" onClick={() => setMenuOpen(false)} />}
        </div>
    );
});
