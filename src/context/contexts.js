import { createContext } from "react";

/**
 * Context objects live here, apart from their providers.
 *
 * Keeping the `createContext` calls in a component-free module lets Vite's
 * Fast Refresh treat AuthContext.jsx / ToastContext.jsx as pure component
 * files, so editing a provider hot-reloads instead of remounting the tree.
 */

export const AuthContext = createContext(null);
export const ToastContext = createContext(null);
export const GrievanceContext = createContext(null);
