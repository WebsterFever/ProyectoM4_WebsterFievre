import { useAuth } from "../context/AuthContext";
import { logoutUser } from "../services/authService";

function DashboardPage() {
  const { currentUser } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
      <p className="text-lg">Sesión activa: {currentUser?.email}</p>
      <button
        onClick={() => logoutUser()}
        className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
      >
        Cerrar sesión
      </button>
    </div>
  );
}

export default DashboardPage;
