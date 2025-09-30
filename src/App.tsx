import { ProtectedRoute } from './components/ProtectedRoute';
import { Dashboard } from './components/Dashboard';

function App() {
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

export default App;
