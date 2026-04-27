import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import ChangePassword from "../pages/ChangePassword";
import { MemoryRouter } from "react-router-dom";
import "@testing-library/jest-dom";
import { act } from "react";
import axios from "axios";

// Mocks
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

const mockDestroySession = vi.fn();
vi.mock("../SessionContext", () => ({
  useSession: () => ({
    isLoggedIn: true,
    username: "testuser",
    destroySession: mockDestroySession,
  }),
}));

describe("ChangePassword Page & Form", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    // MOCK DEFINITIVO DE LOCALSTORAGE
    // Esto asegura que funcionará sin importar la configuración de JSDom
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('mock-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <ChangePassword />
      </MemoryRouter>
    );

  it("renders all form fields and the submit button", () => {
    renderComponent();

    expect(screen.getByLabelText(/profile\.currentPassword/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profile\.newPassword/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profile\.repeatNewPassword/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /profile\.changePassword/i }).length).toBeGreaterThanOrEqual(1);
  });

  it("shows error messages when submitting empty fields", async () => {
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });

    const errors = screen.getAllByText(/auth\.requiredField/i);
    expect(errors.length).toBeGreaterThanOrEqual(2); // Al menos para current y new
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid password format", async () => {
    renderComponent();
    const user = userEvent.setup();
    const newPassInput = screen.getByLabelText(/profile\.newPassword/i);

    await act(async () => {
      await user.type(newPassInput, "123");
    });

    expect(await screen.findByText(/auth\.passwordRules/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const newPassInput = screen.getByLabelText(/profile\.newPassword/i);
    const repeatPassInput = screen.getByLabelText(/profile\.repeatNewPassword/i);

    await act(async () => {
      await user.type(newPassInput, "ValidPass1!");
      await user.type(repeatPassInput, "DifferentPass1!");
      await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });

    expect(screen.getByText(/auth\.passwordsDoNotMatch/i)).toBeInTheDocument();
  });

  it("shows error when new password is same as current", async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const currentPassInput = screen.getByLabelText(/profile\.currentPassword/i);
    const newPassInput = screen.getByLabelText(/profile\.newPassword/i);
    const repeatPassInput = screen.getByLabelText(/profile\.repeatNewPassword/i);

    await act(async () => {
      await user.type(currentPassInput, "SamePass1!");
      await user.type(newPassInput, "SamePass1!");
      await user.type(repeatPassInput, "SamePass1!");
      await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });

    expect(screen.getByText(/profile\.newPasswordMustDiffer/i)).toBeInTheDocument();
  });

  it("handles successful password change and redirects", async () => {
    mockedAxios.post.mockResolvedValue({ data: { message: "Success" } });
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.type(screen.getByLabelText(/profile\.currentPassword/i), "OldPass1!");
      await user.type(screen.getByLabelText(/profile\.newPassword/i), "NewPass1!");
      await user.type(screen.getByLabelText(/profile\.repeatNewPassword/i), "NewPass1!");
      await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/user/change-password"),
        expect.objectContaining({
          username: "testuser",
          currentPassword: "OldPass1!",
          newPassword: "NewPass1!"
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer mock-token"
          })
        })
      );
      
      expect(window.alert).toHaveBeenCalledWith("profile.changePasswordSuccess");
      
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/logout"),
        { username: "testuser" }
      );

      expect(mockDestroySession).toHaveBeenCalled();
    });
  });

  it("shows backend error when current password is incorrect", async () => {
    // Creamos un Error real para evitar que falle al intentar acceder a propiedades indefinidas
    const mockAxiosError = new Error("Request failed with status code 400") as any;
    mockAxiosError.response = { data: { error: "Incorrect current password" } };
    mockedAxios.post.mockRejectedValue(mockAxiosError);
    
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
        await user.type(screen.getByLabelText(/profile\.currentPassword/i), "WrongPass1!");
        await user.type(screen.getByLabelText(/profile\.newPassword/i), "NewPass1!");
        await user.type(screen.getByLabelText(/profile\.repeatNewPassword/i), "NewPass1!");
        await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });

    await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/errors\.incorrectCurrentPassword/i);
    });
  });

  it("clears validation errors when user types again", async () => {
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getAllByRole("button", { name: /profile\.changePassword/i })[0]);
    });
    expect(screen.getAllByText(/auth\.requiredField/i)[0]).toBeInTheDocument();

    await act(async () => {
      const currentPassInput = screen.getByLabelText(/profile\.currentPassword/i);
      await user.type(currentPassInput, "a");
    });
    expect(screen.getByLabelText(/profile\.currentPassword/i)).not.toHaveAttribute('aria-invalid', 'true');
  });
});