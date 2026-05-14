import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

export type Role = "kajal" | "rashesh";

interface AuthContextType {
  role: Role | null;
  username: string | null;
  token: string | null;
  isLoggedIn: boolean;
  login: (token: string, role: Role, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {

  // Read from localStorage on first load so a page refresh
  // doesn't log the user out
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem("token")
  );
  const [role, setRole] = useState<Role | null>(
    () => (localStorage.getItem("role") as Role) || null
  );
  const [username, setUsername] = useState<string | null>(
    () => localStorage.getItem("username")
  );

  const isLoggedIn = !!token && !!role;

  const login = (t: string, r: Role, u: string) => {
    localStorage.setItem("token", t);
    localStorage.setItem("role", r);
    localStorage.setItem("username", u);
    setToken(t);
    setRole(r);
    setUsername(u);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    setToken(null);
    setRole(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider
      value={{ role, username, token, isLoggedIn, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Main hook — use this everywhere in the app
export function useRole() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}