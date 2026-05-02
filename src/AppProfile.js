import React, { useEffect, useRef, useState } from "react";
import { Route, useHistory } from "react-router-dom";
import classNames from "classnames";
import { CSSTransition } from "react-transition-group";
import { observer } from "mobx-react";
import { useDataStore } from "../src/data/DataStoreContext";
export const AppProfile = observer((props) => {
    //console.log.log("props", props);
    const [expanded, setExpanded] = useState(false);
    const history = useHistory();
    const [authUser, setAuthUser] = useState(JSON.parse(localStorage.getItem("user")));
    //console.log.log("AppProfile", JSON.parse(localStorage.getItem("user")));
    /*
    Store
    */
    const dataStore = useDataStore();

    useEffect(() => {}, []);

    const onClick = (event) => {
        setExpanded((prevState) => !prevState);
        event.preventDefault();
    };

    const onClickLogout = () => {
        props.onLogout(); // Invocar la función de cierre de sesión de Menu.js
    };
    return (
        <div className="layout-profile">
            <div>
                <img src="assets/layout/images/profile.png" alt="Profile" />
            </div>
            <button className="p-link layout-profile-link" onClick={onClick}>
                <span className="username">{authUser.username}</span>
                <i className="pi pi-fw pi-cog" />
            </button>
            <CSSTransition classNames="p-toggleable-content" timeout={{ enter: 1000, exit: 450 }} in={expanded} unmountOnExit>
                <ul className={classNames({ "layout-profile-expanded": expanded })}>
                    <li>
                        <button type="button" className="p-link">
                            <i className="pi pi-fw pi-user" />
                            <span>Account</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className="p-link">
                            <i className="pi pi-fw pi-inbox" />
                            <span>Notifications</span>
                            <span className="menuitem-badge">2</span>
                        </button>
                    </li>
                    <li>
                        <button type="button" className="p-link" onClick={onClickLogout}>
                            <i className="pi pi-fw pi-power-off" />
                            <span>Logout</span>
                        </button>
                    </li>
                </ul>
            </CSSTransition>
        </div>
    );
});
