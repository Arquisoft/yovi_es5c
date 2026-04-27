import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import GameSetup, { getInitialBoardSize, minBoardSize, maxBoardSize } from "../pages/GameSetup";
import "@testing-library/jest-dom";
import { act } from "react";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
}));

const mockSession = {
  isLoggedIn: true,
};

vi.mock("../SessionContext", () => ({
  useSession: () => mockSession,
}));

beforeEach(() => {
  mockSession.isLoggedIn = true;
  sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
});

/* ---------------- TESTS ---------------- */

describe("getInitialBoardSize Helper", () => {
  it("debería devolver 5 si no hay nada en sessionStorage", () => {
    expect(getInitialBoardSize()).toBe(5);
  });

  it("debería devolver 5 si el valor guardado no es un número", () => {
    sessionStorage.setItem("boardSize", "invalid");
    expect(getInitialBoardSize()).toBe(5);
  });

  it("debería devolver el valor parseado si está dentro de los límites", () => {
    sessionStorage.setItem("boardSize", "7");
    expect(getInitialBoardSize()).toBe(7);
  });

  it("debería acotar al valor mínimo si es menor", () => {
    sessionStorage.setItem("boardSize", (minBoardSize - 2).toString());
    expect(getInitialBoardSize()).toBe(minBoardSize);
  });

  it("debería acotar al valor máximo si es mayor", () => {
    sessionStorage.setItem("boardSize", (maxBoardSize + 5).toString());
    expect(getInitialBoardSize()).toBe(maxBoardSize);
  });
});

describe("GameSetup page", () => {
  it("redirects to login when user is not logged", () => {
    mockSession.isLoggedIn = false;

    render(<GameSetup />);

    expect(screen.getByTestId("navigate")).toHaveTextContent("/login");
  });

  it("renders new game title", () => {
    render(<GameSetup />);

    expect(screen.getByText(/setup\.title/i)).toBeInTheDocument();
  });

  it("navigates when Player vs Player button is clicked", async () => {
    await act(async () => {
      render(<GameSetup />);
    });

    const user = userEvent.setup();

    await act(async () => {
      await user.click(
        screen.getByRole("button", {
          name: /setup\.pvp/i,
        })
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", { 
        state: { 
          mode: "pvp",
          initialSessionTime: 30, // Calculado para size 5 y dificultad Medium (default PvP)
          incrementPerMove: 2     // Calculado para size 5 y dificultad Medium
        } 
      });
    });
  });

  it("navigates with correct timer values for board size 8 (scale 1.5)", async () => {
    sessionStorage.setItem("boardSize", "8");
    render(<GameSetup />);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: /setup\.pvp/i,
      })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", { 
        state: { 
          mode: "pvp",
          initialSessionTime: 45, // 30 * 1.5 * 1.0 = 45
          incrementPerMove: 3     // 2 * 1.5 * 1.0 = 3
        } 
      });
    });
  });

  it("navigates with correct timer values for board size 12 (scale 1.75)", async () => {
    sessionStorage.setItem("boardSize", "12");
    render(<GameSetup />);

    const user = userEvent.setup();

    await user.click(
      screen.getByRole("button", {
        name: /setup\.pvp/i,
      })
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", { 
        state: { 
          mode: "pvp",
          initialSessionTime: 52, // floor(30 * 1.75 * 1.0) = floor(52.5) = 52
          incrementPerMove: 3     // floor(2 * 1.75 * 1.0) = floor(3.5) = 3
        } 
      });
    });
  });

  // --- SPINNER SIZE ---

  it("debería permitir incrementar el tamaño del tablero y guardarlo en sessionStorage", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    expect(screen.getByText("5")).toBeInTheDocument();

    const increaseBtn = screen.getByRole("button", { name: /setup\.increaseBoardSize/i });

    await user.click(increaseBtn);

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(sessionStorage.getItem("boardSize")).toBe("6");
  });

  it("debería permitir reducir el tamaño del tablero y guardarlo en sessionStorage", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    const decreaseBtn = screen.getByRole("button", { name: /setup\.decreaseBoardSize/i });

    await user.click(decreaseBtn);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(sessionStorage.getItem("boardSize")).toBe("4");
  });

  it("debería deshabilitar el botón de reducir si se alcanza el mínimo", async () => {
    sessionStorage.setItem("boardSize", minBoardSize.toString());
    render(<GameSetup />);

    const decreaseBtn = screen.getByRole("button", { name: /setup\.decreaseBoardSize/i });
    expect(decreaseBtn).toBeDisabled();
  });

  it("debería deshabilitar el botón de aumentar si se alcanza el máximo", async () => {
    sessionStorage.setItem("boardSize", maxBoardSize.toString());
    render(<GameSetup />);

    const increaseBtn = screen.getByRole("button", { name: /setup\.increaseBoardSize/i });
    expect(increaseBtn).toBeDisabled();
  });

  // --- BOTS ---

  it("debería navegar correctamente tras seleccionar un bot y una dificultad", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    const botMenuBtn = screen.getByRole("button", { name: /setup\.bot/i });
    await user.click(botMenuBtn);

    const randomBotOption = (await screen.findAllByRole("menuitem"))[0]
    expect(randomBotOption).toBeInTheDocument();

    await user.click(randomBotOption);

    const hardDifficultyOption = await screen.findByRole("menuitem", {
      name: /home\.difficulties\.hard/i,
    });

    await user.click(hardDifficultyOption);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", {
        state: {
          mode: "bot",
          bot_id: "random_bot",
          difficulty: "Hard",
          initialSessionTime: 15, // Calculado para size 5 y dificultad Hard (30 * 0.5)
          incrementPerMove: 1     // Calculado para size 5 y dificultad Hard (2 * 0.5)
        },
      });
    });
  });

  it("debería lanzar una partida aleatoria (ruleta) y navegar a /game con bot y dificultad", async () => {
	  const user = userEvent.setup();
	  render(<GameSetup />);

	  const randomButton = screen.getByRole("button", {
		  name: /setup\.random/i
	  });

	  await user.click(randomButton);

	  await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", {
        state: {
          mode: "bot",
          bot_id: expect.any(String),
          difficulty: expect.stringMatching(/Easy|Medium|Hard/),
        },
      });
      },
    { timeout: 3000 });
  });
});

