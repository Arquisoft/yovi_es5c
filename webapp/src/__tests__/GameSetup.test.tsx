import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import GameSetup, { getInitialBoardSize, minBoardSize, maxBoardSize } from "../pages/GameSetup";
import "@testing-library/jest-dom";
import { act } from "react";

/* ---------------- MOCKS ---------------- */

const mockNavigate = vi.fn();

/* Mock react-router-dom */
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
  sessionStorage.clear(); // Limpiamos la sesión antes de cada test para no contaminar
  vi.clearAllMocks();
});

/* Reset mocks after each test */
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
      expect(mockNavigate).toHaveBeenCalledWith("/game", { state: { mode: "pvp" } });
    });
  });

  // --- TESTS DEL SPINNER DE TAMAÑO ---

  it("debería permitir incrementar el tamaño del tablero y guardarlo en sessionStorage", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    // El estado inicial debe ser 5
    expect(screen.getByText("5")).toBeInTheDocument();

    const increaseBtn = screen.getByRole("button", { name: /increase board size/i });
    
    await user.click(increaseBtn);

    expect(screen.getByText("6")).toBeInTheDocument();
    expect(sessionStorage.getItem("boardSize")).toBe("6");
  });

  it("debería permitir reducir el tamaño del tablero y guardarlo en sessionStorage", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    const decreaseBtn = screen.getByRole("button", { name: /decrease board size/i });
    
    await user.click(decreaseBtn);

    expect(screen.getByText("4")).toBeInTheDocument();
    expect(sessionStorage.getItem("boardSize")).toBe("4");
  });

  it("debería deshabilitar el botón de reducir si se alcanza el mínimo", async () => {
    sessionStorage.setItem("boardSize", minBoardSize.toString());
    render(<GameSetup />);

    const decreaseBtn = screen.getByRole("button", { name: /decrease board size/i });
    expect(decreaseBtn).toBeDisabled();
  });

  it("debería deshabilitar el botón de aumentar si se alcanza el máximo", async () => {
    sessionStorage.setItem("boardSize", maxBoardSize.toString());
    render(<GameSetup />);

    const increaseBtn = screen.getByRole("button", { name: /increase board size/i });
    expect(increaseBtn).toBeDisabled();
  });

  // --- TESTS DEL MENÚ DE BOTS ---

  it("debería navegar correctamente tras seleccionar un bot y una dificultad", async () => {
    const user = userEvent.setup();
    render(<GameSetup />);

    // Abrimos el menú principal de bots
    const botMenuBtn = screen.getByRole("button", { name: /player vs bot/i });
    await user.click(botMenuBtn);

    // Verificamos que se renderizan los bots (ej. Random Bot)
    const randomBotOption = screen.getByText(/Random Bot/i);
    expect(randomBotOption).toBeInTheDocument();

    // Clicamos en un bot para abrir el menú de dificultad
    await user.click(randomBotOption);

    // Verificamos que se renderiza el submenú de dificultad y clicamos en "Hard"
    const hardDifficultyOption = await screen.findByText("Hard");
    expect(hardDifficultyOption).toBeInTheDocument();

    await user.click(hardDifficultyOption);

    // Verificamos que navegó con el estado correcto
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/game", {
        state: {
          mode: "bot",
          bot_id: "random_bot",
          difficulty: "Hard",
        },
      });
    });
  });


  it("debería lanzar una partida aleatoria (ruleta) y navegar a /game con bot y dificultad", async () => {
	  const user = userEvent.setup();
	  render(<GameSetup />);

	  const randomButton = screen.getByRole("button", {
		  name: /random game/i,
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
