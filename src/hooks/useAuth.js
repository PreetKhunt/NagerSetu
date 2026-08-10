import { useContext } from "react";
import { AuthContext } from "../context/contexts";

/** Access the current (UI-only) session. Must be used inside AuthProvider. */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
