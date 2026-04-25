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
      expect(screen.getByText("GAME Y")).toBeInTheDocument();
    });

    it("renders the Play button", () => {
      render(<HomePage />);
      expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
    });

    it("does not show the help modal on load", () => {
      render(<HomePage />);
      expect(screen.queryByRole("dialog", { name: /how to play/i })).not.toBeInTheDocument();
    });
  });

  describe("Navigation", () => {
    it("navigates to /set when the Play button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const playButton = screen.getByRole("button", { name: /^play$/i });
      await user.click(playButton);

      expect(mockNavigate).toHaveBeenCalledWith("/set");
    });
  });

  describe("Help Modal (Instructions)", () => {
    it("opens the modal when the '?' button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      const helpButton = screen.getByRole("button", { name: /^how to play$/i });
      await user.click(helpButton);

      expect(screen.getByRole("dialog", { name: /how to play/i })).toBeInTheDocument();
    });

    it("shows the Rules tab content by default", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await user.click(screen.getByRole("button", { name: /^how to play$/i }));

      expect(screen.getByText(/connect the/i)).toBeInTheDocument();
      expect(screen.getByText(/three sides/i)).toBeInTheDocument();
      expect(screen.getByText(/cannot end in a draw/i)).toBeInTheDocument();
    });

    it("switches to the Opponents tab and shows bot descriptions", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      await user.click(screen.getByRole("button", { name: /^how to play$/i }));

      const opponentsTab = screen.getByRole("tab", { name: /opponents/i });
      await user.click(opponentsTab);

      expect(screen.getByText(/random bot/i)).toBeInTheDocument();
      expect(screen.getByText(/center bot/i)).toBeInTheDocument();
    });

    it("closes the modal when the close (X) button is clicked", async () => {
      const user = userEvent.setup();
      render(<HomePage />);
      
      await user.click(screen.getByRole("button", { name: /^how to play$/i }));
      expect(screen.getByRole("dialog", { name: /how to play/i })).toBeInTheDocument();

      const closeButton = screen.getByRole("button", { name: /close help modal/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByRole("dialog", { name: /how to play/i })).not.toBeInTheDocument();
      });
    });
  });
});
