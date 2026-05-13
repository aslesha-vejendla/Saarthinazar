import {
  createBrowserRouter,
  Navigate
} from "react-router-dom";

import App from "./App";

import Dashboard from "./pages/Dashboard";
import Alerts from "./pages/Alerts";
import TeamUsage from "./pages/TeamUsage";
import TopUps from "./pages/TopUps";
import Invoices from "./pages/Invoices";
import UploadReports from "./pages/UploadReports";
import FinancialInsights from "./pages/FinancialInsights";
import MasterData from "./pages/MasterData";

import Login from "./pages/Login";

import ProtectedRoute from "./components/ProtectedRoute";


function AdminRoute({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {

  const role =
    localStorage.getItem("role");

  const isAdmin =

    role === "admin"

    ||

    role === "owner"

    ||

    role === "rashesh";

  if (!isAdmin) {

    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}


export const router =
  createBrowserRouter([

    {
      path: "/",

      element: (

        localStorage.getItem("token")

          ? <Navigate to="/dashboard" />

          : <Navigate to="/login" />
      )
    },

    {
      path: "/login",

      element: <Login />
    },

    {
      path: "/",

      element: (

        <ProtectedRoute>

          <App />

        </ProtectedRoute>
      ),

      children: [

        {
          path: "/dashboard",

          element: <Dashboard />
        },

        {
          path: "/alerts",

          element: <Alerts />
        },

        {
          path: "/team-usage",

          element: <TeamUsage />
        },

        {
          path: "/topups",

          element: <TopUps />
        },

        {
          path: "/invoices",

          element: <Invoices />
        },

        {
          path: "/upload-reports",

          element: <UploadReports />
        },

        // =====================================
        // ADMIN ONLY
        // =====================================

        {
          path: "/financial",

          element: (

            <AdminRoute>

              <FinancialInsights />

            </AdminRoute>
          )
        },

        {
          path: "/master-data",

          element: (

            <AdminRoute>

              <MasterData />

            </AdminRoute>
          )
        }

      ]
    }

]);