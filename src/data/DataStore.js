import { makeAutoObservable } from 'mobx';

class DataStore {
  authUser = null;
  jwtToken = null;
  userRole = null;
  userPrefs = { modoOscuro: false, modoSeguro: false };
  darkMode = false;
  notifications = [];

  constructor() {
    makeAutoObservable(this);
    this.loadFromStorage();
  }

  loadFromStorage() {
    const token = localStorage.getItem('jwtToken');
    const user = localStorage.getItem('authUser');
    const role = localStorage.getItem('userRole');
    const dark = localStorage.getItem('darkMode') === 'true';
    if (token) {
      this.jwtToken = token;
      this.authUser = user;
      this.userRole = role;
    }
    if (dark) {
      this.darkMode = true;
      this.applyDarkMode(true);
    }
  }

  setAuth(user, token, role) {
    this.authUser = user;
    this.jwtToken = token;
    this.userRole = role;
    localStorage.setItem('jwtToken', token);
    localStorage.setItem('authUser', user);
    localStorage.setItem('userRole', role || '');
    localStorage.setItem('login', 'true');
  }

  setAuthPrincipalUser(principalUser) {
    this.authUser = principalUser.username;
    if (principalUser.token) {
      this.jwtToken = principalUser.token;
    }
  }

  removeAuthPrincipalUser() {
    this.logout();
  }

  setDarkMode(val) {
    this.darkMode = val;
    localStorage.setItem('darkMode', val);
    this.applyDarkMode(val);
  }

  applyDarkMode(val) {
    document.body.classList.toggle('dark-mode', val);
  }

  logout() {
    this.authUser = null;
    this.jwtToken = null;
    this.userRole = null;
    localStorage.clear();
  }

  get isAuthenticated() {
    return !!this.jwtToken;
  }

  get isAdmin() {
    return this.userRole === 'ADMIN';
  }

  get isSupervisor() {
    return ['ADMIN', 'SUPERVISOR'].includes(this.userRole);
  }
}

export const dataStore = new DataStore();
export default DataStore;
