import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach  } from "vitest";
import Ranking from "../pages/GameRanking";
import "@testing-library/jest-dom";
import axios from "axios";


/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
}));

const mockSession = {
  isLoggedIn: true,
  username: "alice",
};

vi.mock("../SessionContext", () => ({
  useSession: () => mockSession,
}));

vi.mock("axios");
const mockedAxios = vi.mocked(axios,true); 

const mockRanking = [
  { username: "alice", played: 10, wins: 8, losses: 2, winRate: 80 },
  { username: "bob",   played: 10, wins: 6, losses: 4, winRate: 60 },
  { username: "carol", played: 10, wins: 4, losses: 6, winRate: 40 },
  { username: "dave",  played: 10, wins: 2, losses: 8, winRate: 20 },
];

beforeEach(() => {
  mockSession.isLoggedIn = true;
  mockSession.username = "alice";
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});

/* ---------------- TESTS ---------------- */

describe("Ranking page - auth", () => {
  it("redirects to login if the user is not logged in", () => {
    mockSession.isLoggedIn = false;
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(<Ranking />);

    expect(screen.getByTestId("navigate")).toHaveTextContent("/login");
  });
});

describe("Ranking page - loading states", () => {
  it("shows loading text while fetching data", () => {
    mockedAxios.get.mockImplementation(() => new Promise(() => {}));

    render(<Ranking />);

    expect(screen.getByText(/ranking\.loading/i)).toBeInTheDocument();
  });

  it("shows empty state if there are no games", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText(/ranking\.empty/i)).toBeInTheDocument();
    });
  });

  it("shows error message if the request fails", async () => {
    mockedAxios.get.mockRejectedValue({ message: "Network Error" });

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText(/ranking\.error/i)).toBeInTheDocument();
    });
  });
});

describe("Ranking page - data rendering", () => {
  it("renders the title and subtitle", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    expect(screen.getByText(/ranking\.title/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/ranking\.subtitle/i)).toBeInTheDocument();
    });
  });

  it("renders all players in the table", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText("alice")).toBeInTheDocument();
      expect(screen.getByText("bob")).toBeInTheDocument();
      expect(screen.getByText("carol")).toBeInTheDocument();
      expect(screen.getByText("dave")).toBeInTheDocument();
    });
  });

  it("shows the 'you' badge only on the current user's row", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => {
      const youBadges = screen.getAllByText(/you/i);
      expect(youBadges).toHaveLength(1);
    });
  });

  it("shows medals on the top three positions", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => {
      expect(screen.getByText("🥇")).toBeInTheDocument();
      expect(screen.getByText("🥈")).toBeInTheDocument();
      expect(screen.getByText("🥉")).toBeInTheDocument();
    });
  });
});

describe("Ranking page - sorting", () => {
  it("calls the API with sortBy=wins and order=desc by default", async () => {
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/game/ranking"),
        { params: { sortBy: "wins", order: "desc" } }
      );
    });
  });

  it("toggles order to ascending when clicking the active column again", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => screen.getByText(/ranking\.wins/i));

    await user.click(screen.getByText( /ranking\.wins/i));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/game/ranking"),
        { params: { sortBy: "wins", order: "asc" } }
      );
    });
  });

  it("changes sortBy and resets to descending when clicking a different column", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => screen.getByText(/ranking\.winRate/i));

    await user.click(screen.getByText(/ranking\.winRate/i));

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("/game/ranking"),
        { params: { sortBy: "winRate", order: "desc" } }
      );
    });
  });

  it("updates sort params when changing column", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenLastCalledWith(
        expect.any(String),
        { params: { sortBy: "wins", order: "desc" } }
      );
    });

    await user.click(screen.getByText(/ranking\.winRate/i));

    await waitFor(() => {
    expect(mockedAxios.get).toHaveBeenLastCalledWith(
      expect.any(String),
      { params: { sortBy: "winRate", order: "desc" } }
    );
  });
  });
});

describe("Ranking page - navigation", () => {
  it("back button navigates to /set", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: mockRanking });

    render(<Ranking />);

    await user.click(screen.getByRole("button", { name: /ranking\.back/i }));

    expect(mockNavigate).toHaveBeenCalledWith("/set");
  });
});