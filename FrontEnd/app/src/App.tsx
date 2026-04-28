import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AppShell } from "./components/layout/AppShell";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Movements from "./pages/Movements";
import Reports from "./pages/Reports";

function App() {
  return (
    <Router>
      <AppShell>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/movements" element={<Movements />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </AppShell>
    </Router>
  );
}

export default App;
