import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "./services/firebase";
import { logoutUser } from "./services/authService";
import RegisterPage from "./pages/RegisterPage";

function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log("Cambio de sesión detectado:", user);
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  if (currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gray-100">
        <p className="text-lg">Sesión activa: {currentUser.email}</p>
        <button
          onClick={() => logoutUser()}
          className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
        >
          Cerrar sesión
        </button>
      </div>
    );
  }

  return <RegisterPage />;
}

export default App;
