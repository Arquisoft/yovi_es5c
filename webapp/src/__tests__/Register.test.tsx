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

    const title = screen.getByText(/auth\.userRegistration/i);
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

    await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(nameInput, "Miguel");
      await user.type(surnameInput, "Arias");
      await user.type(emailInput, "migueltest@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "Miguel1**");

      const registerButton = screen.getByRole("button", { name: /auth\.register/i });
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

    await act(async () => {
      await user.type(nameInput, "f");
      await user.type(surnameInput, "f");
      await user.type(emailInput, "test@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "Miguel1**");

      const registerButton = screen.getByRole("button", { name: /auth\.register/i });
      await user.click(registerButton);
    });

    expect(axios.post).not.toHaveBeenCalled();

    expect(screen.getByText(/auth\.requiredField/i)).toBeInTheDocument();
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
      await screen.findByText(/auth\.passwordRules/i)
    ).toBeInTheDocument();
  });

  it("shows error when passwords do not match on submit", async () => {
    await act(async () => {
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();

    const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    const surnameInput = document.querySelector('input[name="surname"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(nameInput, "Miguel");
      await user.type(surnameInput, "Arias");
      await user.type(emailInput, "migueltest@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "OtraPass1**");

      const registerButton = screen.getByRole("button", { name: /auth\.register/i });
      await user.click(registerButton);
  });

  expect(axios.post).not.toHaveBeenCalled();
  expect(screen.getByText(/auth\.passwordsDoNotMatch/i)).toBeInTheDocument();
});

it("shows backend error when registration fails", async () => {
    (axios.post as any).mockRejectedValue({
      response: { data: { error: "User already exists" } },
    });

    await act(async () => {
      render(
        <MemoryRouter>
          <Register />
        </MemoryRouter>
      );
    });

    const user = userEvent.setup();

    const usernameInput = document.querySelector('input[name="username"]') as HTMLInputElement;
    const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
    const surnameInput = document.querySelector('input[name="surname"]') as HTMLInputElement;
    const emailInput = document.querySelector('input[name="email"]') as HTMLInputElement;
    const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
    const confirmPasswordInput = document.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

    await act(async () => {
      await user.type(usernameInput, "miguel1235");
      await user.type(nameInput, "Miguel");
      await user.type(surnameInput, "Arias");
      await user.type(emailInput, "migueltest@test.com");
      await user.type(passwordInput, "Miguel1**");
      await user.type(confirmPasswordInput, "Miguel1**");

      const registerButton = screen.getByRole("button", { name: /auth\.register/i });
      await user.click(registerButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/errors\.userAlreadyExists/i)).toBeInTheDocument();
    });
  });
});

it("shows required errors for all fields when submitting empty", async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  const user = userEvent.setup();
  const registerButton = screen.getByRole("button", { name: /auth\.register/i });
  
  await act(async () => {
    await user.click(registerButton);
  });

  const errors = screen.getAllByText(/auth\.requiredField/i);
  expect(errors.length).toBeGreaterThanOrEqual(5); // username, name, surname, email, password
  expect(axios.post).not.toHaveBeenCalled();
});

it("clears specific field errors when user starts typing again", async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  const user = userEvent.setup();
  const registerButton = screen.getByRole("button", { name: /auth\.register/i });

  //Forzar errores
  await act(async () => {
    await user.click(registerButton);
  });
  expect(screen.getAllByText(/auth\.requiredField/i)[0]).toBeInTheDocument();

  const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
  await act(async () => {
    await user.type(nameInput, "M");
  });

  // El error específico de ese campo debería desaparecer
  expect(screen.queryByLabelText(/auth\.name/i)).not.toHaveAttribute('aria-invalid', 'true');
});

it("shows generic error when backend response has no specific error message", async () => {
  // Mock de error sin mensaje específico en la respuesta
  (axios.post as any).mockRejectedValue({
    response: { data: {} }, 
  });

  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  const user = userEvent.setup();
  
  await act(async () => {
    await user.type(document.querySelector('input[name="username"]')!, "user");
    await user.type(document.querySelector('input[name="name"]')!, "Name");
    await user.type(document.querySelector('input[name="surname"]')!, "Surname");
    await user.type(document.querySelector('input[name="email"]')!, "test@test.com");
    await user.type(document.querySelector('input[name="password"]')!, "ValidPass1!");
    await user.type(document.querySelector('input[name="confirmPassword"]')!, "ValidPass1!");
    
    await user.click(screen.getByRole("button", { name: /auth\.register/i }));
  });

  await waitFor(() => {
    expect(screen.getByText(/errors\.genericRegister/i)).toBeInTheDocument();
  });
});

it("updates confirm password error dynamically while typing", async () => {
  render(
    <MemoryRouter>
      <Register />
    </MemoryRouter>
  );

  const user = userEvent.setup();
  const passwordInput = document.querySelector('input[name="password"]') as HTMLInputElement;
  const confirmInput = document.querySelector('input[name="confirmPassword"]') as HTMLInputElement;

  await act(async () => {
    await user.type(passwordInput, "Password123!");
    await user.type(confirmInput, "Diff");
  });

  expect(screen.getByText(/auth\.passwordsDoNotMatch/i)).toBeInTheDocument();

  await act(async () => {
    await user.clear(confirmInput);
    await user.type(confirmInput, "Password123!");
  });

  expect(screen.queryByText(/auth\.passwordsDoNotMatch/i)).not.toBeInTheDocument();
});