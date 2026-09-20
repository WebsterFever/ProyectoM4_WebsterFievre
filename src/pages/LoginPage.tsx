import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser, loginWithGoogle } from "../services/authService";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    try {
      await loginUser(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError("Incorrect email or password.");
    }
  }

  async function handleGoogleLogin() {
    setError("");

    try {
      await loginWithGoogle();
      navigate("/dashboard");
    } catch (err) {
      console.error("GOOGLE LOGIN ERROR:", err);
      setError("Could not sign in with Google.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-md rounded-lg p-8 w-full max-w-sm flex flex-col gap-4"
      >
        <h1 className="text-2xl font-semibold text-center text-gray-800">
          Sign in
        </h1>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          className="bg-blue-600 text-white rounded-md py-2 font-medium hover:bg-blue-700 transition-colors"
        >
          Sign in
        </button>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="border border-gray-300 bg-white text-gray-700 rounded-md py-2 font-medium hover:bg-gray-50 transition-colors"
        >
          Continue with Google
        </button>

        <p className="text-sm text-center text-gray-600">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;