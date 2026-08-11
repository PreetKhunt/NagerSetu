import { DEMO_CITIZEN, DEMO_OFFICER } from "../utils/mockData";
import { ROLES, STORAGE_KEYS } from "../utils/constants";

/** Simulates network latency so loading states are visible during review. */
const delay = (ms = 550) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Production Adapter to connect to actual FastAPI / Express backend.
 */
class ProductionAuthAdapter {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async login(credentials) {
    const res = await fetch(`${this.baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    if (!res.ok) throw new Error("Invalid credentials");
    return res.json();
  }

  async register(values) {
    const res = await fetch(`${this.baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    if (!res.ok) throw new Error("Registration failed");
    return res.json();
  }

  async logout() {
    // Optionally call a real backend logout endpoint here
    return true;
  }
}

/**
 * Development Adapter stores users in localStorage by email.
 * IT NEVER STORES PASSWORDS. It just checks if the email is registered.
 */
class DevelopmentAuthAdapter {
  constructor() {
    console.warn("[AUTH] Running in DEVELOPMENT MODE. No real backend is connected.");
    // Pre-populate with a demo officer if missing, to allow officer login
    const users = this._getUsers();
    if (!users["officer@nagarsetu.gov.in"]) {
      users["officer@nagarsetu.gov.in"] = DEMO_OFFICER;
      this._saveUsers(users);
    }
  }

  _getUsers() {
    try {
      const raw = localStorage.getItem("dev_mock_users");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  _saveUsers(users) {
    localStorage.setItem("dev_mock_users", JSON.stringify(users));
  }

  async login({ identifier, password, role }) {
    await delay(600);
    const users = this._getUsers();
    const user = users[identifier];

    if (!user) {
      throw new Error("User not found or invalid credentials");
    }

    // In dev mode, we ignore password checks and rely solely on the identifier existing.
    // We enforce role separation if necessary, but primarily we just return the user profile.
    return {
      user: { ...user, role: user.role || role },
      token: `dev-token-${user.id}`,
    };
  }

  async register({ name, identifier, location }) {
    await delay(700);
    const users = this._getUsers();
    
    if (users[identifier]) {
      throw new Error("Email already registered");
    }

    const newUser = {
      id: `usr_${Date.now()}`,
      name: name?.trim() || "New Citizen",
      email: identifier,
      mobile: identifier?.includes("@") ? "" : identifier,
      location: location?.trim() || "",
      role: ROLES.CITIZEN,
      verified: false,
      joinedAt: new Date().toISOString(),
      // Add default preferences if needed
      preferences: { appearance: "system", language: "en" }
    };

    users[identifier] = newUser;
    this._saveUsers(users);

    return {
      user: newUser,
      token: `dev-token-${newUser.id}`,
    };
  }

  async logout() {
    await delay(150);
    return true;
  }
}

class AuthService {
  constructor() {
    const baseUrl = import.meta.env.VITE_API_BASE_URL;
    // For this prototype, if the backend URL is pointing to localhost but the backend isn't up, 
    // it will fail. A more robust check might ping a health endpoint. 
    // For demonstration, we will rely on a flag or assume Dev adapter if backend fails.
    // To strictly support UI testing without backend, we'll default to DevelopmentAdapter unless explicitly disabled.
    const forceProduction = import.meta.env.VITE_FORCE_PRODUCTION_AUTH === "true";

    if (baseUrl && forceProduction) {
      this.adapter = new ProductionAuthAdapter(baseUrl);
    } else {
      this.adapter = new DevelopmentAuthAdapter();
    }
  }

  login(credentials) {
    return this.adapter.login(credentials);
  }

  register(values) {
    return this.adapter.register(values);
  }

  logout() {
    return this.adapter.logout();
  }

  async demoLogin(role = ROLES.CITIZEN) {
    await delay(300);
    const base = role === ROLES.OFFICER ? DEMO_OFFICER : DEMO_CITIZEN;
    return { user: { ...base, role }, token: "ui-only-session" };
  }
}

export const authService = new AuthService();

// Re-export methods to maintain existing API surface
export const login = (credentials) => authService.login(credentials);
export const register = (values) => authService.register(values);
export const demoLogin = (role) => authService.demoLogin(role);
export const logout = () => authService.logout();
