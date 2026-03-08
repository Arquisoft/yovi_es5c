import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import Register from "../pages/Register";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { act } from "react";

import axios from "axios";

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

describe("Register page", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the user registration title", () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const title = screen.getByText(/user registration/i);
    expect(title).toBeInTheDocument();
  });

  it("submits form when data is correct", async () => {
    (axios.post as any).mockResolvedValue({ data: {} });

    await act(async () => {
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();
    const usernameInput = document.querySelector(
      'input[name="username"]'
    ) as HTMLInputElement;

    const nameInput = document.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;

    const surnameInput = document.querySelector(
      'input[name="surname"]'
    ) as HTMLInputElement;

    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    /* ---------- USER ACTIONS ---------- */

    await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(nameInput, "Miguel");
      await user.type(surnameInput, "Arias");
      await user.type(emailInput, "migueltest@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "Miguel1**");

      const registerButton = screen.getByRole("button", { name: /register/i });
      await user.click(registerButton);
    });

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalled();
    });
  });

  it("not put a field like username", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();

    const nameInput = document.querySelector(
      'input[name="name"]'
    ) as HTMLInputElement;

    const surnameInput = document.querySelector(
      'input[name="surname"]'
    ) as HTMLInputElement;

    const emailInput = document.querySelector(
      'input[name="email"]'
    ) as HTMLInputElement;

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    const confirmPasswordInput = document.querySelector(
      'input[name="confirmPassword"]'
    ) as HTMLInputElement;

    /* ---------- USER ACTIONS ---------- */

    await act(async () => {
      await user.type(nameInput, "f");
      await user.type(surnameInput, "f");
      await user.type(emailInput, "migueltest@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "Miguel1**");

      const registerButton = screen.getByRole("button", { name: /register/i });
      await user.click(registerButton);
    });

    expect(axios.post).not.toHaveBeenCalled();

    expect(screen.getByText(/required field/i)).toBeInTheDocument();
  });

  it("shows password error when password is invalid", async () => {
    render(
      <MemoryRouter>
        <Register />
      </MemoryRouter>
    );

    const user = userEvent.setup();

    const passwordInput = document.querySelector(
      'input[name="password"]'
    ) as HTMLInputElement;

    await act(async () => {
      await user.type(passwordInput, "123");
    });
    expect(
      await screen.findByText(/must have at least 8 characters/i)
    ).toBeInTheDocument();
  });
});
