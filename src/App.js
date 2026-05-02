import React, { useState } from 'react';
import { Login } from './middleware/seguridad/Login';
import { Menu } from './pages/Menu';
import { observer } from 'mobx-react';
import { useDataStore } from './data/DataStoreContext';
import { ToastProvider } from './components/shared/ToastContext';
import 'primereact/resources/themes/saga-blue/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './layout/layout.scss';
import './App.scss';
import './styles/darkmode.css';

export const App = observer(() => {
    const dataStore = useDataStore();
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwtToken'));

    const handleLogin = (val) => {
        setIsLoggedIn(val);
    };

    return (
        <ToastProvider>
            {(!isLoggedIn || !dataStore.jwtToken)
                ? <Login setIsLoggedIn={handleLogin} />
                : <Menu setIsLoggedIn={handleLogin} />
            }
        </ToastProvider>
    );
});
