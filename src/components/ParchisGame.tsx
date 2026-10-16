import React, { useState, useEffect, useRef } from 'react';
import { Users, Layout, Loader2, Dices, Timer, User, Copy, Play, ArrowRight, CheckCircle2 } from 'lucide-react';
import { db } from '../store/db';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatImageUrl } from '../lib/utils';

export type TokenRef = {
    id: string;
    playerId: string;
    state: 'home' | 'board' | 'safe' | 'corridor' | 'goal';
    position: number; // 0 for home/goal, 1-68 for board, 1-7 for corridor, 8 for goal
    stepsWalked?: number;
};

export type Player = {
    id: string;
    name: string;
    avatar: string;
    color: string;
    tokenColor: string; // Tailwind bg color for token
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    isBot?: boolean;
    userId?: string;
};

const APP_VERSION = 7;

type DiceState = {
    values: [number, number];
    isRolling: boolean;
    used: [boolean, boolean];
};

// Map of 1-68 cell positions to percentage coordinates (x, y) on standard 15x15 board image
const BOARD_COORDINATES: Record<number, { x: number; y: number }> = {
    65: { x: 3.5, y: 56.5 },
    66: { x: 7.8, y: 56.5 },
    67: { x: 12.1, y: 56.5 },
    68: { x: 16.4, y: 56.5 },
    1:  { x: 20.7, y: 56.5 },
    2:  { x: 25.0, y: 56.5 },
    3:  { x: 29.3, y: 56.5 },
    4:  { x: 33.6, y: 56.5 },

    5:  { x: 43.5, y: 62.5 },
    6:  { x: 43.5, y: 66.8 },
    7:  { x: 43.5, y: 71.1 },
    8:  { x: 43.5, y: 75.4 },
    9:  { x: 43.5, y: 79.7 },
    10: { x: 43.5, y: 84.0 },
    11: { x: 43.5, y: 88.3 },
    12: { x: 43.5, y: 92.6 },

    13: { x: 50.0, y: 96.5 },

    14: { x: 56.5, y: 92.6 },
    15: { x: 56.5, y: 88.3 },
    16: { x: 56.5, y: 84.0 },
    17: { x: 56.5, y: 79.7 },
    18: { x: 56.5, y: 75.4 },
    19: { x: 56.5, y: 71.1 },
    20: { x: 56.5, y: 66.8 },
    21: { x: 56.5, y: 62.5 },

    22: { x: 62.5, y: 56.5 },
    23: { x: 66.8, y: 56.5 },
    24: { x: 71.1, y: 56.5 },
    25: { x: 75.4, y: 56.5 },
    26: { x: 79.7, y: 56.5 },
    27: { x: 84.0, y: 56.5 },
    28: { x: 88.3, y: 56.5 },
    29: { x: 92.6, y: 56.5 },

    30: { x: 96.5, y: 50.0 },

    31: { x: 92.6, y: 43.5 },
    32: { x: 88.3, y: 43.5 },
    33: { x: 84.0, y: 43.5 },
    34: { x: 79.7, y: 43.5 },
    35: { x: 75.4, y: 43.5 },
    36: { x: 71.1, y: 43.5 },
    37: { x: 66.8, y: 43.5 },
    38: { x: 62.5, y: 43.5 },

    39: { x: 56.5, y: 37.5 },
    40: { x: 56.5, y: 33.2 },
    41: { x: 56.5, y: 28.9 },
    42: { x: 56.5, y: 24.6 },
    43: { x: 56.5, y: 20.3 },
    44: { x: 56.5, y: 16.0 },
    45: { x: 56.5, y: 11.7 },
    46: { x: 56.5, y: 7.4 },

    47: { x: 50.0, y: 3.5 },

    48: { x: 43.5, y: 7.4 },
    49: { x: 43.5, y: 11.7 },
    50: { x: 43.5, y: 16.0 },
    51: { x: 43.5, y: 20.3 },
    52: { x: 43.5, y: 24.6 },
    53: { x: 43.5, y: 28.9 },
    54: { x: 43.5, y: 33.2 },
    55: { x: 43.5, y: 37.5 },

    56: { x: 37.5, y: 43.5 },
    57: { x: 33.2, y: 43.5 },
    58: { x: 28.9, y: 43.5 },
    59: { x: 24.6, y: 43.5 },
    60: { x: 20.3, y: 43.5 },
    61: { x: 16.0, y: 43.5 },
    62: { x: 11.7, y: 43.5 },
    63: { x: 7.4, y: 43.5 },

    64: { x: 3.5, y: 50.0 },
    
    // Pasillos de Meta (Home Stretches) - Defaults
    // Rojo (Bottom)
    69: { x: 50.0, y: 92.6 }, 70: { x: 50.0, y: 88.3 }, 71: { x: 50.0, y: 84.0 }, 72: { x: 50.0, y: 79.7 }, 73: { x: 50.0, y: 75.4 }, 74: { x: 50.0, y: 71.1 }, 75: { x: 50.0, y: 66.8 },
    // Verde (Right)
    76: { x: 92.6, y: 50.0 }, 77: { x: 88.3, y: 50.0 }, 78: { x: 84.0, y: 50.0 }, 79: { x: 79.7, y: 50.0 }, 80: { x: 75.4, y: 50.0 }, 81: { x: 71.1, y: 50.0 }, 82: { x: 66.8, y: 50.0 },
    // Amarillo (Top)
    83: { x: 50.0, y: 7.4 }, 84: { x: 50.0, y: 11.7 }, 85: { x: 50.0, y: 16.0 }, 86: { x: 50.0, y: 20.3 }, 87: { x: 50.0, y: 24.6 }, 88: { x: 50.0, y: 28.9 }, 89: { x: 50.0, y: 33.2 },
    // Azul (Left)
    90: { x: 7.4, y: 50.0 }, 91: { x: 11.7, y: 50.0 }, 92: { x: 16.0, y: 50.0 }, 93: { x: 20.3, y: 50.0 }, 94: { x: 24.6, y: 50.0 }, 95: { x: 28.9, y: 50.0 }, 96: { x: 33.2, y: 50.0 }
};

const getStartCell = (pPosition: string): number => {
    if (pPosition === 'bottom-left') return 56; // Amarillo bottom-left
    if (pPosition === 'bottom-right') return 5;  // Rojo bottom-right
    if (pPosition === 'top-right') return 22;    // Verde top-right
    if (pPosition === 'top-left') return 39;     // Azul top-left
    return 5;
};

const getHouseBadge = (bgClass: string) => {
    if (bgClass?.includes('yellow')) return { name: 'Amarilla', colorClass: 'bg-yellow-400 text-yellow-950 border-yellow-500' };
    if (bgClass?.includes('blue')) return { name: 'Azul', colorClass: 'bg-blue-500 text-white border-blue-600' };
    if (bgClass?.includes('green')) return { name: 'Verde', colorClass: 'bg-emerald-500 text-white border-emerald-600' };
    if (bgClass?.includes('red')) return { name: 'Roja', colorClass: 'bg-red-500 text-white border-red-600' };
    return { name: 'Casa', colorClass: 'bg-neutral-500 text-white border-neutral-600' };
};

const getOffset = (tokenId: string, allOnSamePos: TokenRef[]) => {
    const idx = allOnSamePos.findIndex(t => t.id === tokenId);
    if (allOnSamePos.length <= 1 || idx === -1) return { dx: 0, dy: 0 };
    const angle = (idx / allOnSamePos.length) * 2 * Math.PI;
    const distance = 1.0; // small distance offset in percentage
    return {
        dx: distance * Math.cos(angle),
        dy: distance * Math.sin(angle)
    };
};

const defaultPlayers: Player[] = [
    { id: 'local', name: 'Jugador 1', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=p1', color: 'bg-yellow-500', tokenColor: 'bg-yellow-500 shadow-yellow-700/50', position: 'bottom-left', isBot: false },
    { id: 'player-2', name: 'Jugador 2', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=p2', color: 'bg-blue-500', tokenColor: 'bg-blue-500 shadow-blue-700/50', position: 'top-left', isBot: false },
    { id: 'player-3', name: 'Jugador 3', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=p3', color: 'bg-green-500', tokenColor: 'bg-green-500 shadow-green-700/50', position: 'top-right', isBot: false },
    { id: 'player-4', name: 'Jugador 4', avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=p4', color: 'bg-red-500', tokenColor: 'bg-red-500 shadow-red-700/50', position: 'bottom-right', isBot: false }
];

export const getPlayerConfigForCorner = (pos: 'bottom-left' | 'top-left' | 'top-right' | 'bottom-right', color: string, id: string, name: string) => {
    let bgClass = 'bg-red-500';
    let tokenClass = 'bg-red-500 shadow-red-700/50';
    if (color === 'blue') {
        bgClass = 'bg-blue-500';
        tokenClass = 'bg-blue-500 shadow-blue-700/50';
    } else if (color === 'yellow') {
        bgClass = 'bg-yellow-500';
        tokenClass = 'bg-yellow-500 shadow-yellow-700/50';
    } else if (color === 'green') {
        bgClass = 'bg-green-500';
        tokenClass = 'bg-green-500 shadow-green-700/50';
    }
    const seed = id === 'local' ? 'p1' : id === 'player-2' ? 'p2' : id === 'player-3' ? 'p3' : 'p4';
    return {
        id,
        name,
        avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=${seed}`,
        color: bgClass,
        tokenColor: tokenClass,
        position: pos,
        isBot: false
    };
};

const defaultTokens: TokenRef[] = (() => {
    const initialTokens: TokenRef[] = [];
    defaultPlayers.forEach(p => {
        for(let j = 0; j < 4; j++) {
            initialTokens.push({ id: `${p.id}-t${j}`, playerId: p.id, state: 'home', position: 0, stepsWalked: 0 });
        }
    });
    return initialTokens;
})();

export const ParchisGame = () => {
    const sessionToken = useRef(Date.now());
    const [playerCount, setPlayerCount] = useState<4 | 6>(4);
    const [isPlaying, setIsPlaying] = useState(false);
    
    const [boardImage, setBoardImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Dynamic Board Settings
    const [coordinates, setCoordinates] = useState<Record<number, { x: number; y: number }>>(BOARD_COORDINATES);
    const [safeCells, setSafeCells] = useState<number[]>([]);
    const [exitCells, setExitCells] = useState<Record<string, number>>({});
    const [cornerColors, setCornerColors] = useState<Record<string, string> | null>(null);

    // For manual split movement choice
    const [activeMoveChoices, setActiveMoveChoices] = useState<{
        token: TokenRef;
        options: { label: string; diceIndices: number[]; steps: number; isHomeExit?: boolean }[];
    } | null>(null);

    // Multiplayer state
    const { user, appUser } = useAuth();
    const [roomId, setRoomId] = useState<string | null>(null);
    const [joinCodeInput, setJoinCodeInput] = useState('');
    const [roomStatus, setRoomStatus] = useState<'lobby' | 'waiting' | 'playing'>('lobby');
    const [isProcessing, setIsProcessing] = useState(false);
    const [remotePlayers, setRemotePlayers] = useState<any[]>([]);
    const [statusMessage, setStatusMessage] = useState('');

    // Game state
    const [players, setPlayers] = useState<Player[]>(defaultPlayers);
    const [tokens, setTokens] = useState<TokenRef[]>(defaultTokens);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [isMoving, setIsMoving] = useState(false);

    const [timeLeft, setTimeLeft] = useState(20);
    const [diceState, setDiceState] = useState<DiceState | null>(null);

    const bgChannelRef = useRef<any>(null); // For broadcasting events

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const settings = await db.getPlatformSettings();
                const parchisConfig = settings.gamificationSettings?.parchisConfig;
                if (parchisConfig) {
                    if (parchisConfig.boardImageUrl && parchisConfig.boardImageUrl !== "/tablero-parques.png") {
                        const baseUrl = formatImageUrl(parchisConfig.boardImageUrl);
                        // session specific cache busting (only if not a base64 data url)
                        const timestamp = sessionToken.current; 
                        const finalUrl = (baseUrl.startsWith('data:') || baseUrl.includes('?'))
                            ? baseUrl 
                            : `${baseUrl}?v=${timestamp}`;
                        setBoardImage(finalUrl);
                    } else {
                        // Use a valid standard public Parchis board if none is configured
                        setBoardImage("https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Parchis_board.svg/1024px-Parchis_board.svg.png");
                    }
                    if (parchisConfig.customCoordinates && Object.keys(parchisConfig.customCoordinates).length > 0) {
                        setCoordinates(parchisConfig.customCoordinates);
                    }
                    if (parchisConfig.safeCells && parchisConfig.safeCells.length > 0) {
                        setSafeCells(parchisConfig.safeCells);
                    }
                    if (parchisConfig.exitCells && Object.keys(parchisConfig.exitCells).length > 0) {
                        setExitCells(parchisConfig.exitCells);
                    }
                    if (parchisConfig.cornerColors) {
                        setCornerColors(parchisConfig.cornerColors);
                        const activeCornerColors = parchisConfig.cornerColors;
                        const customPlayers = [
                            getPlayerConfigForCorner('bottom-left', activeCornerColors['bottom-left'] || 'yellow', 'local', 'Jugador 1'),
                            getPlayerConfigForCorner('top-left', activeCornerColors['top-left'] || 'blue', 'player-2', 'Jugador 2'),
                            getPlayerConfigForCorner('top-right', activeCornerColors['top-right'] || 'green', 'player-3', 'Jugador 3'),
                            getPlayerConfigForCorner('bottom-right', activeCornerColors['bottom-right'] || 'red', 'player-4', 'Jugador 4')
                        ];
                        setPlayers(customPlayers);
                    }
                }
            } catch (err) {
                console.error("Error cargando config del tablero:", err);
            } finally {
                setIsLoading(false);
            }
        };

        loadConfig();
        const safetyTimer = setTimeout(() => setIsLoading(false), 3000);
        return () => clearTimeout(safetyTimer);
    }, []);

    // Ensure turn index is always valid
    useEffect(() => {
        if (players.length > 0 && currentTurnIndex >= players.length) {
            setCurrentTurnIndex(0);
        }
    }, [players.length, currentTurnIndex]);

    const broadcastSync = (payload: any) => {
        if (bgChannelRef.current) {
            let finalizedPayload = { ...payload };
            if (payload.tokens && user) {
                finalizedPayload.tokens = payload.tokens.map((t: any) => {
                    let playerId = t.playerId;
                    if (playerId === 'local') {
                        playerId = user.id;
                    } else if (playerId.startsWith('remote-')) {
                        playerId = playerId.replace('remote-', '');
                    }
                    return {
                        ...t,
                        playerId
                    };
                });
            }
            bgChannelRef.current.send({
                type: 'broadcast',
                event: 'sync_action',
                payload: { ...finalizedPayload, version: APP_VERSION }
            });
        }
    };

    const passTurn = () => {
        if (players.length === 0) return;
        const nextIdx = (currentTurnIndex + 1) % players.length;
        setDiceState(null);
        setCurrentTurnIndex(nextIdx);
        setTimeLeft(20);
        broadcastSync({ diceState: null, currentTurnIndex: nextIdx, timeLeft: 20 });
    };

    // Timer logic
    useEffect(() => {
        if (!isPlaying || players.length === 0) return;
        // If dice already rolled and is not rolling, pause/freeze timer
        if (diceState && !diceState.isRolling) return;
        
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                // If dice is rolling, pause timer
                if (diceState?.isRolling) return prev;
                
                if (prev <= 1) {
                    // Turn expires, next player
                    passTurn();
                    return 20;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, players.length, diceState?.isRolling, diceState === null]);

    // Sync tokens if local player is the one playing
    useEffect(() => {
        if (roomStatus === 'playing' && isPlaying) {
            const activePlayer = players[currentTurnIndex];
            if (activePlayer && activePlayer.id === 'local') {
                broadcastSync({ tokens });
            }
        }
    }, [tokens]);

    const executeStepMovement = async (tokenId: string, totalSteps: number) => {
        setIsMoving(true);
        
        let currentPos = 0;
        let currentState: TokenRef['state'] = 'home';
        let currentStepsWalked = 0;
        let currentPlayerId = '';

        // Initial fetch of token info
        const initialToken = tokens.find(t => t.id === tokenId);
        if (initialToken) {
            currentPos = initialToken.position;
            currentState = initialToken.state;
            currentStepsWalked = initialToken.stepsWalked || 0;
            currentPlayerId = initialToken.playerId;
        }

        for (let step = 0; step < totalSteps; step++) {
            const player = players.find(p => p.id === currentPlayerId);
            const startCell = player ? (exitCells[player.position] ?? getStartCell(player.position)) : 5;

            if (currentState === 'home') {
                currentState = 'board';
                currentPos = startCell;
                currentStepsWalked = 0;
            } else if (currentState === 'board') {
                if (currentStepsWalked >= 63) {
                    currentState = 'corridor';
                    currentPos = 1;
                    currentStepsWalked++;
                } else {
                    currentPos = (currentPos % 68) + 1;
                    currentStepsWalked++;
                }
            } else if (currentState === 'corridor') {
                if (currentPos >= 7) {
                    currentState = 'goal';
                    currentPos = 8;
                    currentStepsWalked++;
                } else {
                    currentPos++;
                    currentStepsWalked++;
                }
            }

            // Capture local values for setTokens closure
            const newPos = currentPos;
            const newState = currentState;
            const newSteps = currentStepsWalked;

            setTokens(prev => prev.map(t => t.id === tokenId ? { ...t, state: newState, position: newPos, stepsWalked: newSteps } : t));
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        // Check for captures at end of movement
        if (currentState === 'board' && !safeCells.includes(currentPos)) {
            const finalPos = currentPos;
            setTokens(prev => {
                const moverAtEnd = prev.find(t => t.id === tokenId);
                if (!moverAtEnd) return prev;
                
                return prev.map(t => {
                    if (t.id !== tokenId && t.playerId !== moverAtEnd.playerId && t.state === 'board' && t.position === finalPos) {
                        return { ...t, state: 'home', position: 0, stepsWalked: 0 };
                    }
                    return t;
                });
            });
        }

        setIsMoving(false);
    };

    const autoExitPieces = async (isDouble: boolean, activePlayerId: string, vals: [number, number]) => {
        if (isMoving) return;
        
        const playerTokens = tokens.filter(t => t.playerId === activePlayerId);
        const homeTokens = playerTokens.filter(t => t.state === 'home');
        
        if (homeTokens.length === 0) return;
        
        const tokenToExit = homeTokens[0];
        let used = [false, false] as [boolean, boolean];
        
        if (isDouble) {
            used = [true, true];
            const updatedDS = { values: vals, isRolling: false, used };
            setDiceState(updatedDS);
            broadcastSync({ diceState: updatedDS });
            await executeStepMovement(tokenToExit.id, 1);
        } else {
            if (vals[0] === 5) used = [true, false];
            else if (vals[1] === 5) used = [false, true];
            else if (vals[0] + vals[1] === 5) used = [true, true];
            
            const updatedDS = { values: vals, isRolling: false, used };
            setDiceState(updatedDS);
            broadcastSync({ diceState: updatedDS });
            await executeStepMovement(tokenToExit.id, 1);
        }
        
        if (used[0] && used[1]) {
            setTimeout(() => passTurn(), 1000);
        }
    };

    const handleRollDice = () => {
        if (diceState?.isRolling || isMoving) return;
        
        setDiceState({ values: [1, 1], isRolling: true, used: [false, false] });
        broadcastSync({ diceState: { values: [1, 1], isRolling: true, used: [false, false] } });
        
        // Simular el giro físico de los dados
        setTimeout(() => {
            const val1 = Math.floor(Math.random() * 6) + 1;
            const val2 = Math.floor(Math.random() * 6) + 1;
            const newDiceState: DiceState = { values: [val1, val2], isRolling: false, used: [false, false] };
            setDiceState(newDiceState);
            setTimeLeft(20);
            broadcastSync({ diceState: newDiceState, timeLeft: 20 });
            
            const activePlayer = players[currentTurnIndex];
            if (!activePlayer) return;
            
            // Si el jugador saca una combinación de salida (cualquier doble, un 5, o suma 5)
            const isDouble = val1 === val2;
            const hasFive = val1 === 5 || val2 === 5 || (val1 + val2 === 5);
            
            if (isDouble) {
                autoExitPieces(true, activePlayer.id, [val1, val2]);
            } else if (hasFive) {
                autoExitPieces(false, activePlayer.id, [val1, val2]);
            }
        }, 800);
    };

    const applyMoveOption = async (token: TokenRef, option: { label: string; diceIndices: number[]; steps: number; isHomeExit?: boolean }) => {
        setActiveMoveChoices(null);
        if (!diceState) return;
        let used = [...diceState.used] as [boolean, boolean];
        option.diceIndices.forEach((idx: number) => {
            used[idx] = true;
        });
        setDiceState(ds => ds ? { ...ds, used } : ds);
        await executeStepMovement(token.id, option.steps);
        
        if (used[0] && used[1]) {
            setTimeout(() => passTurn(), 800);
        }
    };

    const handleTokenClick = async (token: TokenRef) => {
        if ((roomStatus !== 'playing' && !isPlaying) || isMoving) return;
        if (!diceState || diceState.isRolling) return;
        
        const activePlayer = players[currentTurnIndex];
        if (!activePlayer || token.playerId !== activePlayer.id || activePlayer.id !== 'local') return;
        if (diceState.used[0] && diceState.used[1]) return;
        
        // Calcular opciones disponibles para mover esta ficha
        const options: { label: string; diceIndices: number[]; steps: number; isHomeExit?: boolean }[] = [];
        
        const d1Unused = !diceState.used[0];
        const d2Unused = !diceState.used[1];
        const val1 = diceState.values[0];
        const val2 = diceState.values[1];
        
        if (token.state === 'home') {
            // Ficha en la cárcel: requiere un 5 para salir
            if (d1Unused && val1 === 5) {
                options.push({ label: "Sacar Ficha con Dado 1 (5)", diceIndices: [0], steps: 1, isHomeExit: true });
            }
            if (d2Unused && val2 === 5) {
                options.push({ label: "Sacar Ficha con Dado 2 (5)", diceIndices: [1], steps: 1, isHomeExit: true });
            }
            if (d1Unused && d2Unused && (val1 + val2 === 5)) {
                options.push({ label: "Sacar Ficha combinando dados (Suma 5)", diceIndices: [0, 1], steps: 1, isHomeExit: true });
            }
        } else {
            // Ficha en el tablero o pasillo de meta
            if (d1Unused) {
                options.push({ label: `Avanzar ${val1} casillas`, diceIndices: [0], steps: val1 });
            }
            if (d2Unused) {
                options.push({ label: `Avanzar ${val2} casillas`, diceIndices: [1], steps: val2 });
            }
            if (d1Unused && d2Unused) {
                // Suma de ambos dados
                options.push({ label: `Avanzar ${val1 + val2} casillas (Ambos Dados)`, diceIndices: [0, 1], steps: val1 + val2 });
            }
        }
        
        if (options.length === 0) {
            return;
        } else if (options.length === 1) {
            // Si solo hay una posible opción de movimiento, se ejecuta directamente para mejor usabilidad
            await applyMoveOption(token, options[0]);
        } else {
            // Si hay múltiples combinaciones, dejamos elegir al jugador
            setActiveMoveChoices({ token, options });
        }
    };

    const handleCreateRoom = async (pCount: 4 | 6) => {
        if (!user) return alert("Debes iniciar sesión para jugar online.");
        if (roomId || isProcessing) return;
        try {
            setIsProcessing(true);
            setStatusMessage('Creando sala...');
            
            const { data: roomData, error: roomError } = await supabase
                .from('parchis_rooms')
                .insert([{ player_count: pCount, status: 'waiting' }])
                .select('*')
                .single();
                
            if (roomError) throw roomError;
            
            const { error: playerError } = await supabase
                .from('parchis_players')
                .insert([{ 
                    room_id: roomData.id, 
                    user_id: user.id, 
                    color: 'yellow'
                }]);
                
            if (playerError) throw playerError;
            
            setRoomId(roomData.id);
            setPlayerCount(pCount);
            setRoomStatus('waiting');
        } catch (error) {
            console.error("Error creating room:", error);
            alert("No se pudo crear la sala. Verifica que tengas conexión.");
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };
    
    const handleJoinRoom = async (codeOverride?: string) => {
        if (!user) return alert("Debes iniciar sesión para jugar online.");
        const code = codeOverride || joinCodeInput.trim();
        if (!code) return;
        
        // Extract room ID if it's a full URL
        let finalRoomId = code;
        if (code.includes('inviteCode=')) {
            try {
                const url = new URL(code.startsWith('http') ? code : `https://dummy.com/${code}`);
                finalRoomId = url.searchParams.get('inviteCode') || code;
            } catch (e) {
                console.error("Error parsing room URL:", e);
            }
        }

        try {
            setIsProcessing(true);
            setStatusMessage('Buscando sala...');
            
            const { data: roomData, error: roomError } = await supabase
                .from('parchis_rooms')
                .select('*')
                .eq('id', finalRoomId)
                .maybeSingle();
                
            if (roomError || !roomData) throw new Error("Sala no encontrada.");
            if (roomData.status !== 'waiting') throw new Error("La sala ya está en juego o finalizada.");
            
            const { data: currentPlayers, error: getPlayersError } = await supabase
                .from('parchis_players')
                .select('*')
                .eq('room_id', roomData.id);
                
            if (getPlayersError) throw getPlayersError;
            
            const alreadyJoined = currentPlayers.find(p => p.user_id === user.id);
            if (!alreadyJoined) {
                if (currentPlayers.length >= roomData.player_count) {
                    throw new Error("La sala está llena.");
                }
                
                const colors = ['red', 'blue', 'yellow', 'green', 'purple', 'cyan'];
                const usedColors = currentPlayers.map(p => p.color);
                const nextColor = colors.find(c => !usedColors.includes(c)) || 'red';
                
                setStatusMessage('Uniéndose...');
                
                const { error: joinError } = await supabase
                    .from('parchis_players')
                    .insert([{ 
                        room_id: roomData.id, 
                        user_id: user.id, 
                        color: nextColor 
                    }]);
                    
                if (joinError) throw joinError;
            }
            
            setRoomId(roomData.id);
            setPlayerCount(roomData.player_count as 4 | 6);
            setRoomStatus('waiting');
        } catch (error: any) {
            console.error("Error joining room:", error);
            alert(error.message || "Hubo un error al unirse a la sala.");
        } finally {
            setIsProcessing(false);
            setStatusMessage('');
        }
    };

    const handleSelectColor = async (colorName: string) => {
        if (!roomId || !user) return;
        try {
            // Optimistic update of local state to render immediately
            setRemotePlayers(prev => prev.map(p => {
                if (p.user_id === user.id) {
                    return { ...p, color: colorName };
                }
                if (p.color === colorName) {
                    return { ...p, color: '' };
                }
                return p;
            }));

            const { error } = await supabase
                .from('parchis_players')
                .update({ color: colorName })
                .eq('room_id', roomId)
                .eq('user_id', user.id);
            if (error) throw error;
        } catch (e) {
            console.error("Error setting player color:", e);
        }
    };

    const hasAutoJoined = useRef(false);
    // Auto-join if URL contains inviteCode
    useEffect(() => {
        if (hasAutoJoined.current) return;
        
        const params = new URLSearchParams(window.location.search);
        const code = params.get('inviteCode');
        if (code && user && roomStatus === 'lobby' && !roomId) {
            hasAutoJoined.current = true;
            handleJoinRoom(code);
            
            // Clean up URL to avoid re-triggering if component remounts or on refresh
            const newUrl = window.location.pathname + window.location.search.replace(/[?&]inviteCode=[^&]+/, '').replace(/^&/, '?');
            window.history.replaceState({}, '', newUrl);
        }
    }, [user, roomStatus]);

    useEffect(() => {
        if (!roomId || roomStatus === 'lobby') return;
        
        const fetchPlayers = async () => {
            const { data } = await supabase.from('parchis_players').select('*').eq('room_id', roomId).order('created_at', { ascending: true });
            if (data) {
                // Fetch user data manually from app_users if possible
                const userIds = data.map((d: any) => d.user_id).filter(Boolean);
                let appUsersMap: Record<string, any> = {};
                if (userIds.length > 0) {
                    const { data: usersData } = await supabase.from('app_users').select('id, display_name, email').in('id', userIds);
                    if (usersData) {
                        usersData.forEach(u => appUsersMap[u.id] = u);
                    }
                }

                const enhancedData = data.map((d: any) => ({
                    ...d,
                    displayName: appUsersMap[d.user_id]?.display_name || appUsersMap[d.user_id]?.email?.split('@')[0] || null
                }));

                // Only update if lengths differ or it's first fetch to avoid destroying token states
                setRemotePlayers(prev => {
                     if (prev.length === enhancedData.length && prev.every((p, i) => p.user_id === enhancedData[i].user_id && p.displayName === enhancedData[i].displayName)) {
                         return prev;
                     }
                     return enhancedData;
                });
            }
            
            // Fallback para estado de juego
            const { data: roomData } = await supabase.from('parchis_rooms').select('status').eq('id', roomId).single();
            if (roomData && roomData.status === 'playing') {
                setRoomStatus(prev => {
                     if (prev === 'playing') return prev;
                     return 'playing';
                });
                setIsPlaying(prev => {
                     if (prev) return prev;
                     return true;
                });
            }
        };
        fetchPlayers();
        
        // Intervalo de respaldo para mantener actualizada la lista de forma agresiva
        const intervalId = setInterval(fetchPlayers, 2000);
        
        const channel = supabase.channel(`room_${roomId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parchis_rooms', filter: `id=eq.${roomId}` }, (payload) => {
                if (payload.new && 'status' in payload.new) {
                    if (payload.new.status === 'playing') {
                        setRoomStatus(prev => prev === 'playing' ? prev : 'playing');
                        setIsPlaying(prev => prev ? prev : true);
                    } else if (payload.new.status === 'finished') {
                        alert("El anfitrión ha terminado la partida.");
                        setIsPlaying(false);
                        setRoomStatus('lobby');
                        setRoomId(null);
                        setDiceState(null);
                        setCurrentTurnIndex(0);
                        setTimeLeft(10);
                        setPlayers(defaultPlayers);
                        setTokens(defaultTokens);
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'parchis_players', filter: `room_id=eq.${roomId}` }, () => {
                fetchPlayers();
            })
            .on('broadcast', { event: 'sync_action' }, (payload) => {
                if (payload.payload) {
                    if (payload.payload.version && payload.payload.version > APP_VERSION) {
                        window.location.reload(); // Automáticamente fuerza actualización en clientes desactualizados
                        return;
                    }
                    if (payload.payload.diceState !== undefined) setDiceState(payload.payload.diceState);
                    if (payload.payload.tokens !== undefined) {
                        const netTokens = payload.payload.tokens;
                        const translated = user ? netTokens.map((t: any) => {
                            let playerId = t.playerId;
                            if (playerId === user.id) {
                                playerId = 'local';
                            } else {
                                playerId = `remote-${playerId}`;
                            }
                            return {
                                ...t,
                                playerId
                            };
                        }) : netTokens;
                        setTokens(translated);
                    }
                    if (payload.payload.currentTurnIndex !== undefined) setCurrentTurnIndex(payload.payload.currentTurnIndex);
                    if (payload.payload.timeLeft !== undefined) setTimeLeft(payload.payload.timeLeft);
                }
            })
            .subscribe();
            
        bgChannelRef.current = channel;
            
        return () => {
            clearInterval(intervalId);
            supabase.removeChannel(channel);
            bgChannelRef.current = null;
        };
    }, [roomId, roomStatus]);

    const prevRoomIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (roomStatus === 'playing' && remotePlayers.length > 0) {
            const activeCornerColors = cornerColors;

            const mapColorToDetails = (colorName: string) => {
                let bgClass = 'bg-red-500';
                let tokenClass = 'bg-red-500 shadow-red-700/50';
                let pos: Player['position'] = 'bottom-right'; // default red is bottom-right

                if (colorName === 'blue') {
                    bgClass = 'bg-blue-500';
                    tokenClass = 'bg-blue-500 shadow-blue-700/50';
                    pos = 'top-left';
                } else if (colorName === 'green') {
                    bgClass = 'bg-green-500';
                    tokenClass = 'bg-green-500 shadow-green-700/50';
                    pos = 'top-right';
                } else if (colorName === 'yellow') {
                    bgClass = 'bg-yellow-500';
                    tokenClass = 'bg-yellow-500 shadow-yellow-700/50';
                    pos = 'bottom-left';
                } else if (colorName === 'red') {
                    bgClass = 'bg-red-500';
                    tokenClass = 'bg-red-500 shadow-red-700/50';
                    pos = 'bottom-right';
                }

                // If admin customized corner colors, find which corner has this color
                if (activeCornerColors) {
                    const matchedCorner = Object.keys(activeCornerColors).find(key => activeCornerColors[key] === colorName);
                    if (matchedCorner === 'bottom-left' || matchedCorner === 'top-left' || matchedCorner === 'top-right' || matchedCorner === 'bottom-right') {
                        pos = matchedCorner;
                    }
                }

                return { bgClass, tokenClass, position: pos };
            };

            const newPlayers: Player[] = [];
            const occupiedColors = new Set<string>();
            const occupiedPositions = new Set<string>();

            // First pass: assign chosen and unique colors
            const tempPlayers = remotePlayers.map((rp, i) => {
                let pColor = rp.color || 'red';
                // If color is empty or already claimed, pick another standard color
                const standardColors = ['red', 'blue', 'yellow', 'green'];
                if (!pColor || occupiedColors.has(pColor)) {
                    pColor = standardColors.find(c => !occupiedColors.has(c)) || 'red';
                }
                occupiedColors.add(pColor);

                const details = mapColorToDetails(pColor);
                let pos = details.position;
                if (occupiedPositions.has(pos)) {
                    // find a free standard position
                    const standardPositions: Player['position'][] = ['bottom-left', 'top-left', 'top-right', 'bottom-right'];
                    pos = standardPositions.find(p => !occupiedPositions.has(p)) || 'bottom-left';
                }
                occupiedPositions.add(pos);

                return {
                    rp,
                    pColor,
                    bgClass: details.bgClass,
                    tokenClass: details.tokenClass,
                    position: pos
                };
            });

            for (let i = 0; i < tempPlayers.length; i++) {
                const item = tempPlayers[i];
                const isMe = item.rp.user_id === user?.id;
                newPlayers.push({
                    id: isMe ? 'local' : `remote-${item.rp.user_id}`,
                    name: isMe ? (appUser?.displayName || appUser?.email?.split('@')[0] || 'Tú') : (item.rp.displayName || `Jugador ${i+1}`),
                    avatar: isMe ? (user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.rp.user_id || i}`) : `https://api.dicebear.com/7.x/adventurer/svg?seed=${item.rp.user_id || i}`,
                    color: item.bgClass,
                    tokenColor: item.tokenClass,
                    position: item.position,
                    isBot: false,
                    userId: item.rp.user_id
                });
            }
            
            // Set exactly the connected players. No bots.
            setPlayers(newPlayers);
            
            // Only re-initialize tokens if we switched rooms OR if we just started and have default tokens
            if (prevRoomIdRef.current !== roomId || tokens === defaultTokens) {
                setTokens(prevTokens => {
                    const initialTokens: TokenRef[] = [];
                    newPlayers.forEach(p => {
                        for(let j = 0; j < 4; j++) {
                            initialTokens.push({ id: `${p.id}-t${j}`, playerId: p.id, state: 'home', position: 0, stepsWalked: 0 });
                        }
                    });
                    return initialTokens;
                });
                prevRoomIdRef.current = roomId;
            }
        }
    }, [roomStatus, remotePlayers, playerCount, user, roomId, cornerColors]);

    const handleStartNetworkGame = async () => {
        if (!roomId) return;
        try {
            setIsProcessing(true);
            const { error } = await supabase.from('parchis_rooms').update({ status: 'playing' }).eq('id', roomId);
            if (error) throw error;
            
            // Optimistic update
            setRoomStatus('playing');
            setIsPlaying(true);
        } catch (error) {
            console.error(error);
            alert("No se pudo iniciar el juego.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading && roomStatus === 'playing') {
        return (
            <div className="flex items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full mt-24">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    if (roomStatus === 'lobby' && !isPlaying) {
        const urlParams = new URLSearchParams(window.location.search);
        const hasInvite = urlParams.get('inviteCode');
        
        if (isProcessing || (hasInvite && !roomId)) {
            return (
                <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-4" />
                    <p className="text-neutral-500 font-bold text-center">
                        {hasInvite ? 'Procesando invitación...' : (statusMessage || 'Procesando...')}
                    </p>
                    <p className="text-neutral-400 text-[10px] text-center mt-2 italic px-8">
                        {hasInvite ? 'Estamos verificando el código de tu amigo para que entres a la misma sala.' : 'Un momento por favor...'}
                    </p>
                </div>
            )
        }

        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full">
                <h2 className="text-3xl font-black text-neutral-800 mb-1 tracking-tight text-center">Parqués Español</h2>
                <p className="text-neutral-400 mb-8 text-center text-xs leading-relaxed px-4">
                     Crea una sala en línea o únete a una existente para jugar con tus amigos.
                </p>

                <div className="w-full bg-neutral-50 p-6 rounded-2xl border border-neutral-100 mb-6 space-y-4">
                    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">Crear Nueva Sala Online</p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => handleCreateRoom(4)}
                            disabled={isProcessing}
                            className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all bg-white text-neutral-600 border border-neutral-200 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50`}
                        >
                            <Users className="w-6 h-6" />
                            <span className="text-sm">4 Puestos</span>
                        </button>
                        <button 
                            onClick={() => handleCreateRoom(6)}
                            disabled={isProcessing}
                            className={`flex-1 py-4 rounded-xl font-bold flex flex-col items-center gap-2 transition-all bg-white text-neutral-600 border border-neutral-200 hover:border-emerald-500 hover:text-emerald-600 disabled:opacity-50`}
                        >
                            <Users className="w-6 h-6" />
                            <span className="text-sm">6 Puestos</span>
                        </button>
                    </div>
                </div>

                <div className="w-full bg-neutral-50 p-6 rounded-2xl border border-neutral-100 space-y-4">
                     <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center">Unirse a una Sala</p>
                     
                     <div className="flex gap-2">
                         <input 
                              type="text"
                              value={joinCodeInput}
                              onChange={(e) => setJoinCodeInput(e.target.value)}
                              placeholder="Código de la sala..."
                              className="flex-1 px-4 py-3 bg-white outline-none rounded-xl font-mono text-sm border border-neutral-200 focus:border-emerald-500 transition-colors"
                         />
                         <button 
                              onClick={() => handleJoinRoom()}
                              disabled={isProcessing || !joinCodeInput.trim()}
                              className="px-6 py-3 bg-neutral-900 text-white rounded-xl font-bold hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                         >
                              Unirse
                         </button>
                     </div>
                </div>
                
                {isProcessing && (
                     <div className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-emerald-600">
                         <Loader2 className="w-4 h-4 animate-spin" /> {statusMessage}
                     </div>
                )}
            </div>
        );
    }

    const isHost = remotePlayers.length > 0 && remotePlayers[0]?.user_id === user?.id;
    
    if (roomStatus === 'waiting' && roomId && !isPlaying) {
        return (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                     <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-black text-neutral-800 mb-2 tracking-tight text-center">
                    {isHost ? '¡Sala de Parchís Lista!' : '¡Invitación Aceptada!'}
                </h2>
                <p className="text-neutral-500 text-sm text-center mb-8">
                    {isHost ? 'Comparte el enlace con tus amigos para empezar.' : 'Espera a que el anfitrión inicie la partida.'}
                </p>

                {isHost && (
                    <div className="w-full bg-neutral-50 p-5 rounded-2xl border border-neutral-200 border-dashed mb-8 relative group">
                        <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider text-center mb-2">Enlace de Invitación</p>
                        <p className="text-[10px] font-mono text-center text-neutral-400 break-all mb-4 bg-white/50 p-2 rounded-lg border border-neutral-100">
                            {window.location.origin}/profile?tab=parchis&inviteCode={roomId}
                        </p>
                        <button 
                            onClick={() => {
                                const url = `${window.location.origin}/profile?tab=parchis&inviteCode=${roomId}`;
                                navigator.clipboard.writeText(url);
                                setStatusMessage('¡Enlace copiado!');
                                setTimeout(() => setStatusMessage(''), 2000);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-white mx-auto rounded-xl shadow-sm border border-neutral-200 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all text-sm font-black text-neutral-600 w-full justify-center"
                            title="Copiar enlace"
                        >
                            <Copy className="w-4 h-4" /> Copiar Enlace de Invitación
                        </button>
                    </div>
                )}

                {/* Selector de Color de Casa */}
                <div className="w-full bg-neutral-50 p-6 rounded-2xl border border-neutral-200 mb-6 space-y-4">
                     <p className="text-xs font-black text-neutral-400 uppercase tracking-widest text-center">Escoge tu Casa / Color</p>
                     <div className="grid grid-cols-2 gap-3">
                          {[
                              { id: 'red', name: 'Casa Roja', bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200', activeBg: 'bg-red-50 text-red-700', label: 'Abajo-Der' },
                              { id: 'blue', name: 'Casa Azul', bg: 'bg-blue-500', text: 'text-blue-600', border: 'border-blue-200', activeBg: 'bg-blue-50 text-blue-700', label: 'Arriba-Izq' },
                              { id: 'yellow', name: 'Casa Amarilla', bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200', activeBg: 'bg-yellow-50 text-yellow-700', label: 'Abajo-Izq' },
                              { id: 'green', name: 'Casa Verde', bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200', activeBg: 'bg-green-50 text-green-700', label: 'Arriba-Der' }
                          ].map(house => {
                              const occupant = remotePlayers.find(p => p.color === house.id);
                              const isMe = occupant?.user_id === user?.id;
                              const isOccupied = !!occupant;
                              
                              return (
                                  <button
                                      key={house.id}
                                      onClick={() => {
                                          if (!isOccupied) {
                                              handleSelectColor(house.id);
                                          }
                                      }}
                                      disabled={isOccupied && !isMe}
                                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative ${isMe ? `border-neutral-800 ${house.activeBg} ring-2 ring-neutral-800` : isOccupied ? 'border-neutral-200 bg-neutral-100 opacity-60 cursor-not-allowed' : `border-neutral-200 bg-white hover:${house.border} hover:scale-[1.02]`}`}
                                  >
                                      {/* Colored Indicator Circle */}
                                      <div className={`w-5 h-5 rounded-full ${house.bg} shadow-md mb-1`} />
                                      <span className="text-xs font-bold text-neutral-800 leading-tight">{house.name}</span>
                                      <span className="text-[9px] font-medium text-neutral-400 mt-0.5">{house.label}</span>
                                      
                                      {/* Status text or placeholder */}
                                      {isMe ? (
                                          <span className="absolute top-1 right-2 text-[8px] font-black uppercase text-neutral-800 bg-white px-1.5 py-0.5 rounded-full border border-neutral-200 shadow-sm">Tú</span>
                                      ) : isOccupied ? (
                                          <span className="text-[9px] font-bold text-neutral-500 truncate max-w-full px-2 mt-1">{occupant.displayName || 'Ocupado'}</span>
                                      ) : (
                                          <span className="text-[9px] font-semibold text-emerald-600 mt-1">✓ Libre</span>
                                      )}
                                  </button>
                              );
                          })}
                     </div>
                </div>

                <div className="w-full mb-8">
                     <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Jugadores ({remotePlayers.length}/{playerCount})</p>
                     <div className="space-y-3">
                          {remotePlayers.map((rp, i) => (
                               <div key={rp.id} className="flex items-center gap-3 bg-neutral-50 border border-neutral-100 p-3 rounded-xl">
                                    <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
                                         <User className="w-4 h-4 text-neutral-500" />
                                    </div>
                                    <div className="flex flex-col flex-1">
                                         <span className="text-sm font-bold text-neutral-800">
                                             {rp.displayName || `Jugador ${i + 1}`} {rp.user_id === user?.id ? '(Tú)' : ''}
                                         </span>
                                         {rp.color && (
                                             <span className="text-[10px] font-medium text-neutral-400 capitalize flex items-center gap-1.5 mt-0.5">
                                                 Casa: 
                                                 <span className={`w-2 h-2 rounded-full ${
                                                     rp.color === 'red' ? 'bg-red-500' :
                                                     rp.color === 'blue' ? 'bg-blue-500' :
                                                     rp.color === 'yellow' ? 'bg-yellow-500' :
                                                     'bg-green-500'
                                                 }`} />
                                                 {rp.color === 'red' ? 'Roja' :
                                                  rp.color === 'blue' ? 'Azul' :
                                                  rp.color === 'yellow' ? 'Amarilla' :
                                                  'Verde'}
                                             </span>
                                         )}
                                    </div>
                               </div>
                          ))}
                          {Array.from({ length: playerCount - remotePlayers.length }).map((_, i) => (
                               <div key={`empty-${i}`} className="flex items-center gap-3 bg-white border border-neutral-100 p-3 rounded-xl opacity-50">
                                    <div className="w-8 h-8 rounded-full border-2 border-dashed border-neutral-300 flex items-center justify-center">
                                         <Loader2 className="w-3 h-3 text-neutral-400 animate-spin" />
                                    </div>
                                    <span className="text-sm font-medium text-neutral-400">Esperando...</span>
                               </div>
                          ))}
                     </div>
                </div>

                {isHost ? (
                    <button 
                        onClick={handleStartNetworkGame}
                        disabled={isProcessing || remotePlayers.length < 2}
                        className="w-full bg-emerald-500 text-white py-4 rounded-xl font-black hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="w-5 h-5 animate-spin"/> : <Play className="w-5 h-5" />} Empezar Juego
                    </button>
                ) : (
                    <div className="w-full bg-emerald-50 text-emerald-600 py-4 rounded-xl font-bold flex justify-center items-center gap-2 text-sm border border-emerald-100">
                         <Loader2 className="w-4 h-4 animate-spin" /> Esperando al anfitrión...
                    </div>
                )}
            </div>
        )
    }

    if (players.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full mt-24">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mb-2" />
                <p className="text-neutral-500 text-sm font-medium">Iniciando juego...</p>
            </div>
        );
    }

    const activePlayer = players[currentTurnIndex];
    if (!activePlayer) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-neutral-200 max-w-md mx-auto w-full mt-24">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-500 mb-2" />
                <p className="text-neutral-500 text-sm font-medium">Cargando datos del turno...</p>
            </div>
        );
    }
    const isLocalTurn = activePlayer.id === 'local';

    return (
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-6xl mx-auto rounded-3xl p-4 sm:p-6 bg-neutral-100 border border-neutral-200 shadow-sm relative overflow-hidden">
            
            {/* Control Flotante Volver y Reiniciar (Desktop & Movil) */}
            <div className="md:absolute top-4 left-4 z-10 w-full mb-4 md:mb-0 flex gap-2">
                 <button onClick={() => { setIsPlaying(false); setRoomStatus('lobby'); setRoomId(null); setDiceState(null); setCurrentTurnIndex(0); setTimeLeft(10); setPlayers(defaultPlayers); setTokens(defaultTokens); }} className="px-4 py-2 bg-white text-neutral-600 font-bold border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors text-sm shadow-sm">
                     {isHost ? '← Volver al Lobby' : '← Salir de la partida'}
                 </button>
                 {isHost && (
                     <button onClick={async () => {
                         if (roomId) await supabase.from('parchis_rooms').update({ status: 'finished' }).eq('id', roomId);
                         setIsPlaying(false); setRoomStatus('lobby'); setRoomId(null); setDiceState(null); 
                         setCurrentTurnIndex(0); setTimeLeft(10); setPlayers(defaultPlayers); setTokens(defaultTokens);
                     }} className="px-4 py-2 bg-red-50 text-red-600 font-bold border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm shadow-sm ml-auto md:ml-0">
                         Terminar partida para todos
                     </button>
                 )}
            </div>

            {/* Columna Central: Tablero y Acciones */}
            <div className="flex-1 flex flex-col items-center gap-2 md:mt-12 w-full max-w-[550px]">
                
                {/* Oponentes (Arriba) */}
                <div className="w-full flex justify-between px-2 h-20 items-end">
                    {players.filter(p => p.position.includes('top')).map((p) => {
                        const pIndex = players.findIndex(pl => pl.id === p.id);
                        const isTurn = currentTurnIndex === pIndex;
                        const isRight = p.position.includes('right');
                        return (
                            <div key={p.id} className={`flex items-center gap-3 relative ${isRight ? 'flex-row-reverse ml-auto text-right' : 'flex-row mr-auto text-left'}`}>
                                <div className="flex flex-col items-center">
                                    <div className={`relative w-14 h-14 rounded-full border-4 ${isTurn ? 'border-emerald-400 animate-pulse ring-4 ring-emerald-200' : 'border-neutral-300'} shadow-md transition-all duration-300`}>
                                        <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                        {(() => {
                                             const badge = getHouseBadge(p.color);
                                             return (
                                                 <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border shadow-md ${badge.colorClass} z-10 whitespace-nowrap`}>
                                                     {badge.name}
                                                 </span>
                                             );
                                        })()}
                                        {isTurn && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>}
                                    </div>
                                    <span className="text-[10px] font-bold text-neutral-800 mt-1 truncate max-w-[80px] bg-white/80 px-2 py-0.5 rounded-full border border-neutral-200">{p.name || `Jugador`}</span>
                                </div>

                                {isTurn && (
                                    <div className="flex items-center gap-2 p-1.5 bg-white/40 backdrop-blur-sm rounded-2xl border border-white/50 shadow-sm animate-in fade-in zoom-in duration-300">
                                        {!diceState && isLocalTurn ? (
                                            <button 
                                                onClick={handleRollDice} 
                                                className="px-4 py-2 bg-neutral-900 text-white font-black rounded-xl active:scale-95 transition-all text-[10px] uppercase tracking-tighter shadow-xl border-b-4 border-emerald-600 hover:border-b-2 hover:translate-y-0.5"
                                            >
                                                Lanzar
                                            </button>
                                        ) : diceState ? (
                                            <div className="flex gap-1.5 scale-75 origin-center">
                                                <Dice value={diceState.values[0]} />
                                                <Dice value={diceState.values[1]} />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-2">
                                                 <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
                                                 <span className="text-[10px] font-bold text-neutral-400 uppercase">Turno</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Contenedor del Tablero */}
                <div className="relative w-full aspect-square bg-white shadow-2xl flex items-center justify-center overflow-hidden border border-neutral-200 rounded-[2rem] shrink-0">
                    
                    {/* Imagen de fondo del Tablero */}
                    <div className="w-full h-full relative z-0">
                         <img 
                            src={formatImageUrl(boardImage) || "/tablero-parques.png"} 
                            alt="Tablero" 
                            className="w-full h-full object-contain"
                            key={boardImage || 'default'}
                         />
                    </div>

                    {/* Efecto de Atenuación (Dimming) cuando no es tu turno */}
                    {!isLocalTurn && isPlaying && roomStatus === 'playing' && (
                        <div className="absolute inset-0 bg-black/10 z-[25] pointer-events-none transition-all duration-700" />
                    )}
                    
                    {/* Superposición de Avatares en las 4 esquinas */}
                    {playerCount === 4 && players.map((p, idx) => {
                        let positionClasses = "";
                        switch(p.position) {
                            case 'top-left': positionClasses = "top-[7%] left-[7%]"; break;
                            case 'top-right': positionClasses = "top-[7%] right-[7%]"; break;
                            case 'bottom-left': positionClasses = "bottom-[7%] left-[7%]"; break;
                            case 'bottom-right': positionClasses = "bottom-[7%] right-[7%]"; break;
                        }

                        const isActive = currentTurnIndex === idx;
                        const playerTokens = tokens.filter(t => t.playerId === p.id && t.state === 'home');

                        return (
                            <div 
                                key={p.id} 
                                className={`absolute z-10 w-[18%] aspect-square flex items-center justify-center transition-all duration-300 ${positionClasses}`}
                            >
                                {/* Casa / Base Area */}
                                <div className={`relative w-[75%] h-[75%] rounded-2xl flex items-center justify-center ${isActive ? 'scale-110 z-20' : ''}`}>
                                    <div className={`absolute inset-0 rounded-full border-4 shadow-[inset_0_4px_10px_rgba(0,0,0,0.1)] ${isActive ? 'border-white ring-4 ring-emerald-400 animate-pulse' : 'border-white/50'}`}>
                                    </div>
                                    
                                    {/* Fichas en casa */}
                                    <div className="absolute -inset-3 animate-in fade-in zoom-in duration-500 pointer-events-none">
                                        <div className="w-full h-full relative">
                                            {playerTokens.map((token, tIdx) => {
                                                // Grid pos for 4 tokens around the avatar
                                                let tClasses = "";
                                                if (tIdx === 0) tClasses = "top-0 left-0";
                                                if (tIdx === 1) tClasses = "top-0 right-0";
                                                if (tIdx === 2) tClasses = "bottom-0 left-0";
                                                if (tIdx === 3) tClasses = "bottom-0 right-0";
                                                
                                                return (
                                                    <div 
                                                        key={token.id} 
                                                        className={`absolute w-1/3 h-1/3 rounded-full border-2 border-white shadow-lg pointer-events-auto cursor-pointer hover:scale-125 transition-transform ${p.tokenColor} ${tClasses}`}
                                                        onClick={() => handleTokenClick(token)}
                                                        title="Click para mover ficha (si tienes salida)"
                                                    >
                                                        <div className="absolute inset-1 rounded-full border border-white/30" />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {/* Rendición de fichas con Precisión Absoluta Cuadro a Cuadro */}
                    <div className="absolute inset-0 z-20 pointer-events-none">
                        {tokens.filter(t => t.state === 'board' || t.state === 'corridor' || t.state === 'goal').map(token => {
                            const p = players.find(player => player.id === token.playerId);
                            if (!p) return null;

                            let top = 50;
                            let left = 50;

                            if (token.state === 'board') {
                                const coord = coordinates[token.position];
                                if (coord) {
                                    top = coord.y;
                                    left = coord.x;
                                }
                            } else if (token.state === 'corridor') {
                                // Trayecto de pasillo (corredor) según la posición/esquina del jugador
                                const idx = token.position; // 1 a 7
                                
                                // Map position index to our 69-96 coordinate keys
                                const homeMapping: Record<string, number[]> = {
                                    'bottom-right': [69, 70, 71, 72, 73, 74, 75], // Red (bottom)
                                    'top-right': [76, 77, 78, 79, 80, 81, 82],     // Green (right)
                                    'top-left': [83, 84, 85, 86, 87, 88, 89],       // Blue (top)
                                    'bottom-left': [90, 91, 92, 93, 94, 95, 96]     // Yellow (left)
                                };
                                const mappedPos = homeMapping[p.position]?.[idx - 1];
                                const coord = mappedPos ? coordinates[mappedPos] : null;

                                if (coord) {
                                    top = coord.y;
                                    left = coord.x;
                                } else {
                                    // Fallback calculation if coords not found
                                    const leftEdge = coordinates[64]?.x ?? 3.5;
                                    const topEdge = coordinates[47]?.y ?? 3.5;
                                    const rightEdge = coordinates[30]?.x ?? 96.5;
                                    const bottomEdge = coordinates[13]?.y ?? 96.5;

                                    switch (p.position) {
                                        case 'bottom-left': left = leftEdge + idx * ((50 - leftEdge) / 8); top = 50; break;
                                        case 'top-left': top = topEdge + idx * ((50 - topEdge) / 8); left = 50; break;
                                        case 'top-right': left = rightEdge - idx * ((rightEdge - 50) / 8); top = 50; break;
                                        case 'bottom-right': top = bottomEdge - idx * ((bottomEdge - 50) / 8); left = 50; break;
                                    }
                                }
                            } else if (token.state === 'goal') {
                                // Posición final dentro del triángulo central por color (dinámico)
                                const leftEdge = coordinates[64]?.x ?? 3.5;
                                const topEdge = coordinates[47]?.y ?? 3.5;
                                const rightEdge = coordinates[30]?.x ?? 96.5;
                                const bottomEdge = coordinates[13]?.y ?? 96.5;

                                switch (p.position) {
                                    case 'bottom-left':
                                        left = leftEdge + 7.5 * ((50 - leftEdge) / 8); top = 50; break;
                                    case 'top-left':
                                        left = 50; top = topEdge + 7.5 * ((50 - topEdge) / 8); break;
                                    case 'top-right':
                                        left = rightEdge - 7.5 * ((rightEdge - 50) / 8); top = 50; break;
                                    case 'bottom-right':
                                        left = 50; top = bottomEdge - 7.5 * ((bottomEdge - 50) / 8); break;
                                }
                            }

                            // Aplicar desplazamiento de apilado (staggering) si hay múltiples fichas en la misma posición exacta
                            const samePositions = tokens.filter(t => 
                                t.state === token.state && 
                                t.position === token.position && 
                                t.playerId === token.playerId
                            );
                            const offset = getOffset(token.id, samePositions);
                            top += offset.dy;
                            left += offset.dx;

                            return (
                                <div 
                                    key={token.id}
                                    className={`absolute w-[4.5%] aspect-square -ml-[2.25%] -mt-[2.25%] rounded-full border border-white shadow-md pointer-events-auto cursor-pointer hover:scale-125 transition-all duration-300 ${p.tokenColor}`}
                                    style={{ top: `${top}%`, left: `${left}%` }}
                                    onClick={() => handleTokenClick(token)}
                                    title={`${p.name}: posición ${token.state === 'board' ? token.position : token.state === 'corridor' ? `pasillo ${token.position}` : 'meta'}`}
                                >
                                    <div className="absolute inset-0.5 rounded-full border border-white/40 shadow-[inset_0_1px_3px_rgba(255,255,255,0.4)]" />
                                </div>
                            );
                        })}
                    </div>


                </div>

            {/* Oponentes (Abajo) */}
            <div className="w-full flex justify-between px-2 h-20 items-start mt-2">
                {players.filter(p => !p.position.includes('top')).map((p) => {
                    const pIndex = players.findIndex(pl => pl.id === p.id);
                    const isTurn = currentTurnIndex === pIndex;
                    const isRight = p.position.includes('right');
                    return (
                        <div key={p.id} className={`flex items-center gap-3 relative ${isRight ? 'flex-row-reverse ml-auto text-right' : 'flex-row mr-auto text-left'}`}>
                            <div className="flex flex-col items-center">
                                <div className={`relative w-14 h-14 rounded-full border-4 ${isTurn ? 'border-emerald-400 animate-pulse ring-4 ring-emerald-200' : 'border-neutral-300'} shadow-md transition-all duration-300`}>
                                    <img src={p.avatar} alt={p.name} className="w-full h-full rounded-full object-cover" />
                                    {(() => {
                                         const badge = getHouseBadge(p.color);
                                         return (
                                             <span className={`absolute -top-3.5 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border shadow-md ${badge.colorClass} z-10 whitespace-nowrap`}>
                                                 {badge.name}
                                             </span>
                                         );
                                    })()}
                                    {isTurn && <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>}
                                </div>
                                <span className="text-[10px] font-bold text-neutral-800 mt-1 truncate max-w-[80px] bg-white/80 px-2 py-0.5 rounded-full border border-neutral-200">{p.name || `Jugador`}</span>
                            </div>

                            {isTurn && (
                                <div className="flex items-center gap-2 p-1.5 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-xl animate-in fade-in zoom-in duration-300 z-50">
                                    {!diceState && isLocalTurn ? (
                                        <button 
                                            onClick={handleRollDice} 
                                            className="px-5 py-2.5 bg-neutral-950 text-white font-black rounded-xl active:scale-95 transition-all text-xs uppercase tracking-tighter shadow-[0_4px_0_rgb(16,185,129)] hover:shadow-[0_2px_0_rgb(16,185,129)] hover:translate-y-0.5"
                                        >
                                            Lanzar
                                        </button>
                                    ) : diceState ? (
                                        <div className="flex flex-col items-center gap-1.5 p-1">
                                            <div className="flex gap-2">
                                                <div className="transform scale-90 hover:scale-100 transition-transform">
                                                    <Dice value={diceState.values[0]} />
                                                </div>
                                                <div className="transform scale-90 hover:scale-100 transition-transform">
                                                    <Dice value={diceState.values[1]} />
                                                </div>
                                            </div>
                                            {isLocalTurn && !diceState.isRolling && (
                                                <button 
                                                    onClick={passTurn}
                                                    className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold rounded text-[9px] uppercase tracking-tighter shadow-md transition-all mt-0.5"
                                                >
                                                    Pasar
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 px-3 py-1">
                                             <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                                             <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Esperando...</span>
                                         </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}

                {/* Acciones locales (Centro abajo) */}
                <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center bottom-2 z-30">
                     {isLocalTurn && (!diceState || diceState.isRolling) && (
                          <div className={`mt-1 flex items-center justify-center px-3 py-1 rounded-full ${timeLeft <= 3 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-100 text-emerald-700'} font-bold text-xs ring-1 ring-black/5 shadow-md`}>
                              Tiempo: {timeLeft}s
                          </div>
                     )}
                </div>
            </div>
        </div>

            {/* Columna Derecha: Indicador de Turno */}
            <div className="w-full md:w-[320px] md:mt-12 flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 duration-500">
                {activeMoveChoices && (
                    <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 text-white rounded-3xl p-5 shadow-xl border border-emerald-500/10 space-y-4">
                        <div className="flex items-center justify-between pb-2 border-b border-white/10">
                            <h4 className="font-black text-xs uppercase tracking-widest text-emerald-100 flex items-center gap-2">
                                <Users className="w-4 h-4 text-emerald-300" />
                                Movimiento Manual
                            </h4>
                            <button
                                onClick={() => setActiveMoveChoices(null)}
                                className="text-white/70 hover:text-white bg-white/10 px-2.5 py-1 rounded-full font-bold text-[10px] transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                        <p className="text-xs font-medium text-emerald-100 leading-relaxed">
                            Has seleccionado la Ficha #{activeMoveChoices.token.id.split('-').pop()?.toUpperCase()}. Elige cuál de tus dados quieres usar para avanzar:
                        </p>
                        <div className="flex flex-col gap-2">
                            {activeMoveChoices.options.map((opt, i) => (
                                <button
                                    key={i}
                                    onClick={() => applyMoveOption(activeMoveChoices.token, opt)}
                                    className="w-full text-left bg-white text-neutral-900 hover:bg-neutral-50 px-4 py-3 rounded-xl font-bold text-xs flex items-center justify-between transition-all hover:scale-[1.01] active:scale-[0.99] shadow-md border border-neutral-200"
                                >
                                    <span>{opt.label}</span>
                                    <ArrowRight className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200">
                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                        <h3 className="font-black text-lg text-neutral-900">Estado de Juego</h3>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-neutral-100 rounded-full text-xs font-bold text-neutral-600">
                            <Timer className="w-3.5 h-3.5" /> 00:00
                        </div>
                    </div>
                    
                    <div className="mb-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Turno Actual</span>
                    </div>

                    {/* Fila del Jugador Activo */}
                    <div className={`flex items-center justify-between p-3 rounded-xl border-2 ${activePlayer.id === 'local' ? 'bg-emerald-50 border-emerald-500' : 'bg-neutral-50 border-neutral-200'}`}>
                        <div className="flex items-center gap-3">
                             <div className="relative flex-shrink-0">
                                 <img src={activePlayer.avatar} alt={activePlayer.name} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
                                 <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${activePlayer.color}`}></span>
                             </div>
                             <div>
                                 <span className="block font-bold text-neutral-900 text-sm leading-tight flex items-center gap-1.5 flex-wrap">
                                     {activePlayer.name}
                                     {(() => {
                                         const badge = getHouseBadge(activePlayer.color);
                                         return (
                                             <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shadow-sm ${badge.colorClass}`}>
                                                 {badge.name}
                                             </span>
                                         );
                                     })()}
                                 </span>
                                 {diceState && !diceState.isRolling ? (
                                     <span className="block text-xs font-bold text-amber-600">Moviendo fichas...</span>
                                 ) : (
                                     <span className="block text-xs font-medium text-emerald-600">Lanzando en {timeLeft}s</span>
                                 )}
                             </div>
                        </div>
                        {activePlayer.id === 'local' ? (
                            <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                                <Dices className="w-3.5 h-3.5" />
                            </span>
                        ) : (
                            <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
                        )}
                    </div>

                    <div className="mt-6 mb-2">
                        <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Próximos Jugadores</span>
                    </div>
                    
                    <div className="space-y-2">
                        {players.map((p, idx) => {
                            if (idx === currentTurnIndex) return null; // Saltar el turno actual
                            
                            return (
                                <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors">
                                     <div className="relative flex-shrink-0">
                                         <img src={p.avatar} alt={p.name} className="w-6 h-6 rounded-full opacity-60" />
                                         <span className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${p.color}`}></span>
                                     </div>
                                     <span className="text-sm font-medium text-neutral-500 flex items-center gap-1.5 flex-wrap">
                                         {p.name}
                                         {(() => {
                                             const badge = getHouseBadge(p.color);
                                             return (
                                                 <span className={`text-[7px] font-black uppercase tracking-wider px-1 py-0.5 rounded border opacity-75 ${badge.colorClass}`}>
                                                     {badge.name}
                                                 </span>
                                             );
                                         })()}
                                     </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Historial rápido (Placeholder) */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-200 hidden md:block opacity-60">
                     <h4 className="text-sm font-bold text-neutral-900 mb-3 flex items-center gap-2">
                         <Layout className="w-4 h-4" /> Historial
                     </h4>
                     <div className="space-y-3">
                         <p className="text-xs text-neutral-500 font-medium">Carlos movió ficha roja.</p>
                         <p className="text-xs text-neutral-500 font-medium">Ana sacó Pares (5,5).</p>
                         <p className="text-xs text-neutral-500 font-medium">El juego ha comenzado.</p>
                     </div>
                </div>
            </div>

        </div>
    );
}

// Componente simple para renderizar la cara de un dado 1-6
const Dice = ({ value }: { value: number }) => {
    // Elegant 3D Dice style
    const getDots = (v: number) => {
        const dotBase = "w-3 h-3 rounded-full shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] bg-gradient-to-br from-neutral-800 to-black";
        switch(v) {
            case 1: return <div className={`col-start-2 row-start-2 ${dotBase}`}></div>;
            case 2: return <>
                <div className={`col-start-3 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-3 ${dotBase}`}></div>
            </>;
            case 3: return <>
                <div className={`col-start-3 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-2 row-start-2 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-3 ${dotBase}`}></div>
            </>;
            case 4: return <>
                <div className={`col-start-1 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-3 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-3 ${dotBase}`}></div>
            </>;
            case 5: return <>
                <div className={`col-start-1 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-2 row-start-2 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-3 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-3 ${dotBase}`}></div>
            </>;
            case 6: return <>
                <div className={`col-start-1 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-1 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-2 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-2 ${dotBase}`}></div>
                <div className={`col-start-1 row-start-3 ${dotBase}`}></div>
                <div className={`col-start-3 row-start-3 ${dotBase}`}></div>
            </>;
            default: return null;
        }
    };

    return (
        <div className="w-14 h-14 bg-white rounded-2xl p-2.5 shadow-[0_8px_0_rgb(229,231,235),0_15px_20px_-5px_rgba(0,0,0,0.2)] border-2 border-neutral-100 flex items-center justify-center transform hover:rotate-6 transition-all duration-300">
            <div className="grid grid-cols-3 grid-rows-3 gap-1 w-full h-full place-items-center">
                {getDots(value)}
            </div>
        </div>
    );
};
