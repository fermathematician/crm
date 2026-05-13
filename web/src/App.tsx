import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Dashboard } from "./pages/Dashboard";
import { PrivateRoute } from "./components/PrivateRoute";
import { LeadsList } from "./pages/LeadsLIsta";
import { UserReport } from "./pages/UserReport";

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Reports } from "./pages/Reports";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas  */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Rotas privadas  */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/leads-list"
          element={
            <PrivateRoute>
              <LeadsList />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <Reports />
            </PrivateRoute>
          }
        />

        <Route
          path="/user-report"
          element={
            <PrivateRoute>
              <UserReport />
            </PrivateRoute>
          }
        />

        <Route
          path="/reports/user/:id"
          element={
            <PrivateRoute>
              <UserReport />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
