import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import Login from "../pages/Login";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { act } from "react";
import axios from "axios";

// Mock de Axios y SessionContext, igual que en Register
vi.mock("axios", () => ({
  default: {
    post: vi.fn(),
  },
}));

vi.mock("../SessionContext", () => ({
  useSession: () => ({
    isLoggedIn: false,
    createSession: vi.fn(),
  }),
}));

describe("Login page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the login title", () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    const title = screen.getByText(/login/i);
    expect(title).toBeInTheDocument();
  });

  it("submits form when data is correct", async () => {
    (axios.post as any).mockResolvedValue({ data: { token: "fake-token", username: "miguel1235" } });

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

      const loginButton = screen.getByRole("button", { name: /login/i });
      await user.click(loginButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
      // Opcional: Verificar que el endpoint llamado es el correcto
      // expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/login'), expect.any(Object));
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

    await act(async () => {
      // Solo rellenamos el username, dejamos el password vacío
      await user.type(usernameInput, "miguel1235");

      const loginButton = screen.getByRole("button", { name: /login/i });
      await user.click(loginButton);
    });

    expect(axios.post).not.toHaveBeenCalled();
    // Suponiendo que muestras un mensaje de campo requerido como en el registro
    expect(screen.getByText(/required field/i)).toBeInTheDocument();
  });
});