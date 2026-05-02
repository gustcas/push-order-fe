import React from "react";
import { Redirect, Route } from "react-router-dom";

/**
 * Componente que protege rutas privadas.
 * Si no hay token JWT en localStorage, redirige al login ("/").
 */
export const PrivateRoute = ({ component: Component, ...rest }) => {
    const isAuthenticated = !!localStorage.getItem("jwtToken");

    return (
        <Route
            {...rest}
            render={(props) =>
                isAuthenticated ? (
                    <Component {...props} />
                ) : (
                    <Redirect to="/" />
                )
            }
        />
    );
};
