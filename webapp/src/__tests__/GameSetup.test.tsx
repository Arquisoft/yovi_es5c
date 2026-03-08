import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import GameSetup from "../pages/GameSetup";
import "@testing-library/jest-dom";
import { act } from "react";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();

/* Mock react-router-dom */
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: any) => <div>{to}</div>,
}));

const mockSession = {
  isLoggedIn: true,
};

vi.mock("../SessionContext", () => ({
  useSession: () => mockSession,
}));

beforeEach(() => {
  mockSession.isLoggedIn = true;
});

/* Reset mocks after each test */
afterEach(() => {
  vi.clearAllMocks();
});

/* ---------------- TESTS ---------------- */

describe("GameSetup page", () => {
  it("redirects to login when user is not logged", () => {
    mockSession.isLoggedIn = false;

    render(<GameSetup />);

    expect(screen.getByText("/login")).toBeInTheDocument();
  });

  it("renders new game title", () => {
    render(<GameSetup />);

    expect(screen.getByText(/new game/i)).toBeInTheDocument();
  });

  it("navigates when Player vs Player button is clicked", async () => {
    await act(async () => {
      render(<GameSetup />);
    });

    const user = userEvent.setup();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: /player vs player/i,
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalled();
    });
  });
});
