import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach } from "vitest";
import HomePage from "../pages/HomePage";
import "@testing-library/jest-dom";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
}));

vi.mock("../SessionContext", () => ({
  useSession: () => ({ isLoggedIn: true }),
}));

afterEach(() => {
  vi.clearAllMocks();
});

/* ---------------- TESTS ---------------- */

describe("HomePage", () => {
  
  describe("Initial Render", () => {
    it("renders the game title 'GAME Y'", () => {
      render(<HomePage />);
      expect(screen.getByText(/game y/i)).toBeInTheDocument();
    });

    it("renders the Play button", () => {
      render(<HomePage />);
      expect(screen.getByRole("button", { name: /home\.play/i })).toBeInTheDocument();
    });

    it("does not show the help modal on load", () => {
      render(<HomePage />);
      expect(screen.queryByText(/home\.howToPlay/i)).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to /set when the Play button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const playButton = screen.getByRole("button", { name: /home\.play/i });
      await user.click(playButton);

      expect(mockNavigate).toHaveBeenCalledWith("/set");
    });
  });

  describe("Help Modal (Instructions)", () => {
    it("opens the modal when the '?' button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const helpButton = screen.getByText("?");
      await user.click(helpButton);

      expect(screen.getByText(/home\.howToPlay/i)).toBeInTheDocument();
    });

    it("shows the Rules tab content by default", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await user.click(screen.getByText("?"));

      expect(screen.getByText(/home\.goalDescription/i)).toBeInTheDocument();
      expect(screen.getByText(/home\.cornerRule/i)).toBeInTheDocument();
      expect(screen.getByText(/home\.noDrawRule/i)).toBeInTheDocument();
    });

    it("switches to the Opponents tab and shows bot descriptions", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await user.click(screen.getByText("?"));

      const opponentsTab = screen.getByRole("tab", { name: /home\.opponents/i });
      await user.click(opponentsTab);

      expect(screen.getByText(/home\.bots\.random\.name/i)).toBeInTheDocument();
      expect(screen.getByText(/home\.bots\.center\.name/i)).toBeInTheDocument();
    });

    it("closes the modal when the close (X) button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      await user.click(screen.getByText("?"));
      expect(screen.getByText(/home\.howToPlay/i)).toBeInTheDocument();

      const closeButton = screen.getByTestId("CloseIcon").closest("button");
      await user.click(closeButton!);

      await waitFor(() => {
        expect(screen.queryByText(/home\.howToPlay/i)).not.toBeInTheDocument();
      });
    });
  });
});