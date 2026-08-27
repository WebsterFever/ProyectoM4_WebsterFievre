import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./LoginPage";

vi.mock("../services/authService", () => ({
  loginUser: vi.fn().mockResolvedValue({ uid: "fake-uid" }),
}));

function FakeDashboard() {
  return <p>Dashboard content</p>;
}

describe("LoginPage", () => {
  it("renders the login form", () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Iniciar sesión")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Correo electrónico")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Contraseña")).toBeInTheDocument();
    expect(screen.getByText("Entrar")).toBeInTheDocument();
  });

  it("updates the password input when the user types", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    const passwordInput = screen.getByPlaceholderText("Contraseña") as HTMLInputElement;

    await user.type(passwordInput, "mypassword");

    expect(passwordInput.value).toBe("mypassword");
  });

  it("navigates to /dashboard after successful login", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/dashboard" element={<FakeDashboard />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "password123");
    await user.click(screen.getByText("Entrar"));

    await waitFor(() => {
      expect(screen.getByText("Dashboard content")).toBeInTheDocument();
    });
  });

  it("shows an error message when login fails", async () => {
    const { loginUser } = await import("../services/authService");
    vi.mocked(loginUser).mockRejectedValueOnce(new Error("Invalid credentials"));

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Correo electrónico"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Contraseña"), "wrongpassword");
    await user.click(screen.getByText("Entrar"));

    expect(
      await screen.findByText("Correo o contraseña incorrectos.")
    ).toBeInTheDocument();
  });
});
