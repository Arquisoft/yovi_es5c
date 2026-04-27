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
    // Mock de window.alert ya que se usa en el componente
    vi.spyOn(window, 'alert').mockImplementation(() => {});
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

    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^new password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/repeat new password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change password/i })).toBeInTheDocument();
  });

  it("shows error messages when submitting empty fields", async () => {
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /change password/i }));
    });

    const errors = screen.getAllByText(/auth\.requiredField/i);
    expect(errors.length).toBeGreaterThanOrEqual(2); // Al menos para current y new
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it("shows validation error for invalid password format", async () => {
    renderComponent();
    const user = userEvent.setup();
    const newPassInput = screen.getByLabelText(/^new password/i);

    await act(async () => {
      await user.type(newPassInput, "123");
    });

    expect(await screen.findByText(/auth\.passwordRules/i)).toBeInTheDocument();
  });

  it("shows error when passwords do not match", async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const newPassInput = screen.getByLabelText(/^new password/i);
    const repeatPassInput = screen.getByLabelText(/repeat new password/i);

    await act(async () => {
      await user.type(newPassInput, "ValidPass1!");
      await user.type(repeatPassInput, "DifferentPass1!");
      await user.click(screen.getByRole("button", { name: /change password/i }));
    });

    expect(screen.getByText(/auth\.passwordsDoNotMatch/i)).toBeInTheDocument();
  });

  it("shows error when new password is same as current", async () => {
    renderComponent();
    const user = userEvent.setup();
    
    const currentPassInput = screen.getByLabelText(/current password/i);
    const newPassInput = screen.getByLabelText(/^new password/i);
    const repeatPassInput = screen.getByLabelText(/repeat new password/i);

    await act(async () => {
      await user.type(currentPassInput, "SamePass1!");
      await user.type(newPassInput, "SamePass1!");
      await user.type(repeatPassInput, "SamePass1!");
      await user.click(screen.getByRole("button", { name: /change password/i }));
    });

    expect(screen.getByText(/The new password must be different from the current password/i)).toBeInTheDocument();
  });

  it("handles successful password change and redirects", async () => {
    mockedAxios.post.mockResolvedValue({ data: { message: "Success" } });
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.type(screen.getByLabelText(/current password/i), "OldPass1!");
      await user.type(screen.getByLabelText(/^new password/i), "NewPass1!");
      await user.type(screen.getByLabelText(/repeat new password/i), "NewPass1!");
      await user.click(screen.getByRole("button", { name: /change password/i }));
    });

    await waitFor(() => {
      // Verifica llamada a cambio de pass
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/user/change-password"),
        expect.objectContaining({
          username: "testuser",
          currentPassword: "OldPass1!",
          newPassword: "NewPass1!"
        })
      );
      
      // Verifica alerta
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("successfully"));
      
      // Verifica llamada a logout
      expect(mockedAxios.post).toHaveBeenCalledWith(
        expect.stringContaining("/logout"),
        { username: "testuser" }
      );

      // Verifica limpieza de sesión
      expect(mockDestroySession).toHaveBeenCalled();
    });
  });

    it("shows backend error when current password is incorrect", async () => {
    mockedAxios.post.mockRejectedValue({
        response: { data: { error: "Incorrect current password" } },
    });
    
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
        await user.type(screen.getByLabelText(/current password/i), "WrongPass1!");
        await user.type(screen.getByLabelText(/^new password/i), "NewPass1!");
        await user.type(screen.getByLabelText(/repeat new password/i), "NewPass1!");
        await user.click(screen.getByRole("button", { name: /change password/i }));
    });

    await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(/errors\.fallback/i);
    });
    });

  it("clears validation errors when user types again", async () => {
    renderComponent();
    const user = userEvent.setup();

    await act(async () => {
      await user.click(screen.getByRole("button", { name: /change password/i }));
    });
    expect(screen.getAllByText(/auth\.requiredField/i)[0]).toBeInTheDocument();

    await act(async () => {
      const currentPassInput = screen.getByLabelText(/current password/i);
      await user.type(currentPassInput, "a");
    });
    expect(screen.getByLabelText(/current password/i)).not.toHaveAttribute('aria-invalid', 'true');
  });
});
