import { Route, Routes } from 'react-router-dom';
import { Account } from './pages/account';
import { Auth } from './pages/auth';
import { Home } from './pages/home';
import  Fillereg  from './pages/Fillereg';
import { ProtectedRoute } from './components/protectRoute';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth/:pathname" element={<Auth />} />
      <Route path="/account/:pathname" element={<Account />} />
      <Route path="/Fillereg" element={<ProtectedRoute><Fillereg /></ProtectedRoute>} />
    </Routes>
  );
}