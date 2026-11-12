import { Navigate, Route, Routes } from 'react-router-dom';
import { Home } from './pages/Home';
import { Hub } from './pages/Hub';
import { Play } from './pages/Play';
import { AdultLayout } from './pages/adult/AdultLayout';
import { Dashboard } from './pages/adult/Dashboard';
import { Diagnostic } from './pages/adult/Diagnostic';
import { PlanPage } from './pages/adult/PlanPage';
import { Guides } from './pages/adult/Guides';
import { Account } from './pages/adult/Account';
import { Welcome } from './pages/Welcome';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/games" element={<Hub />} />
      <Route path="/play/:id" element={<Play />} />
      <Route path="/adult" element={<AdultLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="diagnostic" element={<Diagnostic />} />
        <Route path="plan" element={<PlanPage />} />
        <Route path="guides" element={<Guides />} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
