import { Outlet } from "react-router-dom";
import Layout from "./components/Layout";

// App is just the shell — routing is handled in app/routes.tsx
// main.tsx → RouterProvider → routes.tsx → ProtectedRoute → App → Layout → Outlet
export default function App() {
  return <Layout />;
}