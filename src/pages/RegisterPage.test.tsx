import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import RegisterPage from "./RegisterPage";
import LoginPage from "./LoginPage";

vi.mock("../services/authService", () => ({
  registerUser: vi.fn().mockResolvedValue({ uid: "fake-uid" }),
}));

describe("RegisterPage", () => {
  it("renders the registration form", () => {
    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    expect(screen.getByText("Create account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Email address")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
    expect(screen.getByText("Sign up")).toBeInTheDocument();
  });

  it("updates the email input when the user types", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("Email address") as HTMLInputElement;

    await user.type(emailInput, "test@example.com");

    expect(emailInput.value).toBe("test@example.com");
  });

  it("navigates to /login after successful registration", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByText("Sign up"));

    await waitFor(() => {
      expect(screen.getByText("Sign in")).toBeInTheDocument();
    });
  });

  it("shows an error message when registration fails", async () => {
    const { registerUser } = await import("../services/authService");
    vi.mocked(registerUser).mockRejectedValueOnce(new Error("Email already in use"));

    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );

    await user.type(screen.getByPlaceholderText("Email address"), "test@example.com");
    await user.type(screen.getByPlaceholderText("Password"), "password123");
    await user.click(screen.getByText("Sign up"));

    expect(
      await screen.findByText("Email already in use")
    ).toBeInTheDocument();
  });
});
