import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import Login from "../pages/Login";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { act } from "react";

// Mock del SessionContext
vi.mock("../SessionContext", () => ({
  useSession: () => ({
    isLoggedIn: false,
    createSession: vi.fn(),
  }),
}));

describe("Login page", () => {
  beforeEach(() => {
    // Mockeamos la API nativa fetch antes de cada test
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the welcome title", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const title = screen.getByRole("heading", { name: /welcome/i });
    expect(title).toBeInTheDocument();
  });

  it("submits form when data is correct", async () => {
    // Simulamos que la petición fetch devuelve OK (200) y un JSON
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ token: "fake-token", username: "miguel1235" }),
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();
    const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;

    await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(passwordInput, "Miguel1**");

      const loginButton = screen.getByRole("button", { name: /log-in/i });
      await user.click(loginButton);
    });

    await waitFor(() => {
      // Verificamos que fetch haya sido llamado
      expect(global.fetch).toHaveBeenCalled();
    });
  });

  it("does not submit when fields are empty", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();
    const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;

    await act(async () => {
      // Solo rellenamos el username, dejamos el password vacío
      await user.type(usernameInput, "miguel1235");

      const loginButton = screen.getByRole("button", { name: /log-in/i });
      await user.click(loginButton);
    });

    // Validamos que fetch NO ha sido llamado
    expect(global.fetch).not.toHaveBeenCalled();
    
    // Verificamos que el input password es inválido por la validación nativa HTML
    expect(passwordInput).toBeInvalid();
  });

  it("handles network error and logs it", async () => {
  const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

  (global.fetch as any).mockRejectedValue(new Error("Network error"));


  await act(async () => {
      render(<MemoryRouter><Login /></MemoryRouter>);
    });
  

  const user = userEvent.setup();
  const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
  const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;


  await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(passwordInput, "Miguel1**");
    });

  

  const loginButton = screen.getByRole("button", { name: /log-in/i });

  await act(async () => {
      await user.click(loginButton);
    });
  
  
  await waitFor(() => {
    expect(consoleSpy).toHaveBeenCalledWith("Network error");

    expect(
      screen.getByText(/error de conexión con el servidor/i)
    ).toBeInTheDocument();
  });

  consoleSpy.mockRestore();
});
});