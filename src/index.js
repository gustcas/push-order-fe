import React from "react";
import ReactDOM from "react-dom";
import { App } from "./App";
import { HashRouter } from "react-router-dom";
import ScrollToTop from "./ScrollToTop";
import { DataProvider } from "./data/DataStoreContext";
ReactDOM.render(
    <HashRouter>
        <ScrollToTop>
            <DataProvider>
                <App></App>
            </DataProvider>
        </ScrollToTop>
    </HashRouter>,
    document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
//serviceWorker.unregister();
