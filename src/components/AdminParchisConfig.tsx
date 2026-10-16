import React, { useState, useRef, useEffect } from 'react';
import { Target, Users, Play, Coins, Settings2, Save, Users2, UploadCloud, Loader2, X, Shield, Flag, RefreshCw, HelpCircle, ArrowRight, Check, Eye } from 'lucide-react';
import { db } from '../store/db';
import { formatImageUrl } from '../lib/utils';

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
    
    // Pasillos de Meta (Home Stretches)
    // Rojo (Bottom)
    69: { x: 50.0, y: 92.6 },
    70: { x: 50.0, y: 88.3 },
    71: { x: 50.0, y: 84.0 },
    72: { x: 50.0, y: 79.7 },
    73: { x: 50.0, y: 75.4 },
    74: { x: 50.0, y: 71.1 },
    75: { x: 50.0, y: 66.8 },

    // Verde (Right)
    76: { x: 92.6, y: 50.0 },
    77: { x: 88.3, y: 50.0 },
    78: { x: 84.0, y: 50.0 },
    79: { x: 79.7, y: 50.0 },
    80: { x: 75.4, y: 50.0 },
    81: { x: 71.1, y: 50.0 },
    82: { x: 66.8, y: 50.0 },

    // Amarillo (Top)
    83: { x: 50.0, y: 7.4 },
    84: { x: 50.0, y: 11.7 },
    85: { x: 50.0, y: 16.0 },
    86: { x: 50.0, y: 20.3 },
    87: { x: 50.0, y: 24.6 },
    88: { x: 50.0, y: 28.9 },
    89: { x: 50.0, y: 33.2 },

    // Azul (Left)
    90: { x: 7.4, y: 50.0 },
    91: { x: 11.7, y: 50.0 },
    92: { x: 16.0, y: 50.0 },
    93: { x: 20.3, y: 50.0 },
    94: { x: 24.6, y: 50.0 },
    95: { x: 28.9, y: 50.0 },
    96: { x: 33.2, y: 50.0 }
};

export const AdminParchisConfig = () => {
    const [config, setConfig] = useState({
        enabled: true,
        allow4Players: true,
        allow6Players: true,
        costAmount: 10,
        rewardFirstPlace: 50,
        rewardSecondPlace: 20,
        boardImageUrl: ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingBoard, setIsUploadingBoard] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Mapeador & Calibrador states
    const [customCoords, setCustomCoords] = useState<Record<number, { x: number; y: number }>>(BOARD_COORDINATES);
    const [safeCells, setSafeCells] = useState<number[]>([]);
    const [exitCells, setExitCells] = useState<Record<string, number>>({});
    const [cornerColors, setCornerColors] = useState<Record<string, string>>({
        'bottom-left': 'red',
        'bottom-right': 'green',
        'top-right': 'yellow',
        'top-left': 'blue'
    });
    const [selectedCellId, setSelectedCellId] = useState<number | null>(1);
    
    // Soporte para arrastrar números (Drag and Drop)
    const boardContainerRef = useRef<HTMLDivElement>(null);
    const [draggingCellId, setDraggingCellId] = useState<number | null>(null);

    useEffect(() => {
        if (draggingCellId === null) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!boardContainerRef.current) return;
            const rect = boardContainerRef.current.getBoundingClientRect();
            let x = ((e.clientX - rect.left) / rect.width) * 100;
            let y = ((e.clientY - rect.top) / rect.height) * 100;

            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            const roundedX = Math.round(x * 10) / 10;
            const roundedY = Math.round(y * 10) / 10;

            setCustomCoords(prev => ({
                ...prev,
                [draggingCellId]: { x: roundedX, y: roundedY }
            }));
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.cancelable) {
                e.preventDefault();
            }
            if (!boardContainerRef.current || e.touches.length === 0) return;
            const touch = e.touches[0];
            const rect = boardContainerRef.current.getBoundingClientRect();
            let x = ((touch.clientX - rect.left) / rect.width) * 100;
            let y = ((touch.clientY - rect.top) / rect.height) * 100;

            x = Math.max(0, Math.min(100, x));
            y = Math.max(0, Math.min(100, y));

            const roundedX = Math.round(x * 10) / 10;
            const roundedY = Math.round(y * 10) / 10;

            setCustomCoords(prev => ({
                ...prev,
                [draggingCellId]: { x: roundedX, y: roundedY }
            }));
        };

        const handleMouseUp = () => {
            setDraggingCellId(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleMouseUp);
        };
    }, [draggingCellId]);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const settings = await db.getPlatformSettings();
                const parchisConfig = settings.gamificationSettings?.parchisConfig;
                if (parchisConfig) {
                    setConfig({
                        enabled: parchisConfig.enabled ?? true,
                        allow4Players: parchisConfig.allow4Players ?? true,
                        allow6Players: parchisConfig.allow6Players ?? true,
                        costAmount: parchisConfig.costAmount ?? 10,
                        rewardFirstPlace: parchisConfig.rewardFirstPlace ?? 50,
                        rewardSecondPlace: parchisConfig.rewardSecondPlace ?? 20,
                        boardImageUrl: parchisConfig.boardImageUrl ?? ''
                    });

                    if (parchisConfig.customCoordinates && Object.keys(parchisConfig.customCoordinates).length > 0) {
                        // Asegurar conversión de llaves a números
                        const parsedCoords: Record<number, { x: number; y: number }> = {};
                        Object.entries(parchisConfig.customCoordinates).forEach(([k, v]) => {
                            parsedCoords[parseInt(k)] = v as { x: number; y: number };
                        });
                        setCustomCoords(parsedCoords);
                    }
                    if (parchisConfig.safeCells && parchisConfig.safeCells.length > 0) {
                        setSafeCells(parchisConfig.safeCells);
                    }
                    if (parchisConfig.exitCells) {
                        setExitCells(parchisConfig.exitCells);
                    }
                    if (parchisConfig.cornerColors) {
                        setCornerColors(parchisConfig.cornerColors);
                    }
                }
            } catch (err) {
                console.error("Error cargando config de parchís:", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadConfig();
    }, []);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const settings = await db.getPlatformSettings();
            
            // Creamos el payload completo con los mapas personalizados
            const parchisConfigPayload = {
                ...config,
                customCoordinates: customCoords,
                safeCells: safeCells,
                exitCells: exitCells,
                cornerColors: cornerColors
            };

            const updatedGamification = {
                ...(settings.gamificationSettings || {}),
                parchisConfig: parchisConfigPayload
            };
            
            await db.updatePlatformSettings({ gamificationSettings: updatedGamification });
            alert('¡Configuración y Mapeos de Tablero guardados exitosamente!');
        } catch (err) {
            console.error("Error guardando config de parchís:", err);
            alert('Hubo un error al guardar la configuración.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleRestoreDefaults = () => {
        if (window.confirm('¿Estás seguro de restaurar las coordenadas, casillas oficiales y colores por defecto? Esto sobrescribirá tus cambios actuales.')) {
            setCustomCoords(BOARD_COORDINATES);
            setSafeCells([5, 12, 17, 22, 29, 34, 39, 46, 51, 56, 63, 68]);
            setExitCells({
                'bottom-left': 5,
                'bottom-right': 22,
                'top-right': 39,
                'top-left': 56
            });
            setCornerColors({
                'bottom-left': 'red',
                'bottom-right': 'green',
                'top-right': 'yellow',
                'top-left': 'blue'
            });
            alert('Coordenadas, casillas y colores oficiales restaurados. No olvides guardar.');
        }
    };

    const handleSmartAlignment = () => {
        const aligned = { ...customCoords };

        // Segments of 8 consecutive straight cells
        const segments = [
            { ids: [65, 66, 67, 68, 1, 2, 3, 4], axis: 'h' },
            { ids: [5, 6, 7, 8, 9, 10, 11, 12], axis: 'v' },
            { ids: [14, 15, 16, 17, 18, 19, 20, 21], axis: 'v' },
            { ids: [22, 23, 24, 25, 26, 27, 28, 29], axis: 'h' },
            { ids: [31, 32, 33, 34, 35, 36, 37, 38], axis: 'h' },
            { ids: [39, 40, 41, 42, 43, 44, 45, 46], axis: 'v' },
            { ids: [48, 49, 50, 51, 52, 53, 54, 55], axis: 'v' },
            { ids: [56, 57, 58, 59, 60, 61, 62, 63], axis: 'h' }
        ];

        segments.forEach(({ ids, axis }) => {
            const firstId = ids[0];
            const lastId = ids[ids.length - 1];
            const firstCoord = aligned[firstId];
            const lastCoord = aligned[lastId];

            if (!firstCoord || !lastCoord) return;

            if (axis === 'h') {
                // Horizontal alignment
                const sumY = ids.reduce((sum, id) => sum + (aligned[id]?.y || 0), 0);
                const avgY = sumY / ids.length;

                const startX = firstCoord.x;
                const endX = lastCoord.x;
                const step = (endX - startX) / (ids.length - 1);

                ids.forEach((id, index) => {
                    aligned[id] = {
                        x: Math.round((startX + step * index) * 10) / 10,
                        y: Math.round(avgY * 10) / 10
                    };
                });
            } else {
                // Vertical alignment
                const sumX = ids.reduce((sum, id) => sum + (aligned[id]?.x || 0), 0);
                const avgX = sumX / ids.length;

                const startY = firstCoord.y;
                const endY = lastCoord.y;
                const step = (endY - startY) / (ids.length - 1);

                ids.forEach((id, index) => {
                    aligned[id] = {
                        x: Math.round(avgX * 10) / 10,
                        y: Math.round((startY + step * index) * 10) / 10
                    };
                });
            }
        });

        // Smartly center key corner loop turn points (13, 30, 47, 64) relative to their flanking straights
        if (aligned[12] && aligned[14]) {
            aligned[13] = {
                x: Math.round(((aligned[12].x + aligned[14].x) / 2) * 10) / 10,
                y: Math.round(Math.max(aligned[12].y, aligned[14].y) * 10) / 10 + 3.9
            };
        }
        if (aligned[29] && aligned[31]) {
            aligned[30] = {
                x: Math.round(Math.max(aligned[29].x, aligned[31].x) * 10) / 10 + 3.9,
                y: Math.round(((aligned[29].y + aligned[31].y) / 2) * 10) / 10
            };
        }
        if (aligned[46] && aligned[48]) {
            aligned[47] = {
                x: Math.round(((aligned[46].x + aligned[48].x) / 2) * 10) / 10,
                y: Math.round(Math.min(aligned[46].y, aligned[48].y) * 10) / 10 - 3.9
            };
        }
        if (aligned[63] && aligned[65]) {
            aligned[64] = {
                x: Math.round(Math.min(aligned[63].x, aligned[65].x) * 10) / 10 - 3.9,
                y: Math.round(((aligned[63].y + aligned[65].y) / 2) * 10) / 10
            };
        }

        setCustomCoords(aligned);
        alert('¡Alineación Inteligente ejecutada con éxito! Se han detectado los tramos y se han alineado perfectamente las distancias de corrido en rectas y curvas. Asegúrate de presionar "Guardar Todo" para persistir los cambios.');
    };

    const handleBoardClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (selectedCellId === null) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        // Redondear a un decimal para mayor precisión limpia
        const roundedX = Math.round(x * 10) / 10;
        const roundedY = Math.round(y * 10) / 10;
        
        setCustomCoords(prev => ({
            ...prev,
            [selectedCellId]: { x: roundedX, y: roundedY }
        }));
        
        // Deseleccionamos manualmente ahora usando el botón para no desaparecer las configuraciones
        // setSelectedCellId(null);
    };

    const toggleSafeCell = (cellId: number) => {
        setSafeCells(prev => 
            prev.includes(cellId) ? prev.filter(c => c !== cellId) : [...prev, cellId]
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
        );
    }

    const getColorClassForExit = (cornerId: string) => {
        const c = cornerColors[cornerId] || 'emerald';
        if (c === 'red') return 'bg-red-500 ring-4 ring-red-200 text-white border-2 border-white';
        if (c === 'green') return 'bg-green-500 ring-4 ring-green-200 text-white border-2 border-white';
        if (c === 'yellow') return 'bg-yellow-500 ring-4 ring-yellow-200 text-black border-2 border-white';
        if (c === 'blue') return 'bg-blue-500 ring-4 ring-blue-200 text-white border-2 border-white';
        return 'bg-emerald-500 ring-4 ring-emerald-200 text-white border-2 border-white';
    };

    // Color indicators mapping
    const getCellColor = (id: number) => {
        // Find if this is an exit cell and get its cornerId
        let isExitCornerId = null;
        if (exitCells['bottom-left'] === id) isExitCornerId = 'bottom-left';
        if (exitCells['bottom-right'] === id) isExitCornerId = 'bottom-right';
        if (exitCells['top-right'] === id) isExitCornerId = 'top-right';
        if (exitCells['top-left'] === id) isExitCornerId = 'top-left';

        // Select state takes highest priority visually in border
        if (selectedCellId === id) {
            // Apply a strong ring around it
            if (isExitCornerId) {
                return `${getColorClassForExit(isExitCornerId)} ring-[6px] ring-indigo-500 z-30 scale-[1.3]`;
            } else if (safeCells.includes(id)) {
                return 'bg-emerald-500 text-white ring-[6px] ring-indigo-500 border-2 border-emerald-200 z-30 scale-[1.3]';
            } else {
                return 'bg-indigo-600 text-white ring-[6px] ring-indigo-500 border-2 border-white z-30 scale-[1.3] shadow-xl';
            }
        } else {
            if (isExitCornerId) return getColorClassForExit(isExitCornerId);
            if (safeCells.includes(id)) return 'bg-emerald-400 text-white border-2 border-emerald-100 shadow-emerald-200/50';
            return 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300';
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
            
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
               <div>
                  <h2 className="text-3xl font-black text-neutral-900 tracking-tight flex items-center gap-3">
                     <Target className="w-8 h-8 text-indigo-600" />
                     Parchís Super Admin: Calibración y Mapeo
                  </h2>
                  <p className="text-on-surface-variant font-medium mt-1">
                     Define y calibra las salidas, casillas seguras, y haz simulaciones de movimientos paso a paso.
                  </p>
               </div>
               <div className="flex items-center gap-3">
                   <button 
                      onClick={handleRestoreDefaults}
                      className="px-4 py-2.5 bg-white border border-neutral-200 font-bold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all"
                   >
                       <RefreshCw className="w-4 h-4 text-neutral-400" />
                       Restaurar Oficiales
                   </button>
                   <button 
                      onClick={handleSmartAlignment}
                      className="px-4 py-2.5 bg-gradient-to-r from-neutral-800 to-indigo-900 border border-indigo-950 font-bold text-white hover:opacity-95 rounded-xl text-xs flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-indigo-500/10"
                   >
                       Alineación Inteligente
                   </button>
                   <button 
                      onClick={handleSave}
                      disabled={isSaving}
                      className="bg-neutral-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-neutral-800 transition-colors shadow-lg active:scale-95 disabled:opacity-50 text-xs"
                   >
                       {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} 
                       {isSaving ? 'Guardando...' : 'Guardar Todo'}
                   </button>
               </div>
            </div>

            {/* Top row: General Rules & Economics (Standard configuration side-by-side) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group">
                     <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                              <Settings2 className="w-6 h-6 text-indigo-600" />
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-neutral-900">Reglas Generales</h3>
                              <p className="text-xs text-neutral-500 font-bold">Activación y modos de juego</p>
                          </div>
                     </div>
                     <div className="space-y-4">
                          <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors bg-white/50 backdrop-blur-sm">
                              <span className="font-bold text-neutral-700 text-xs">Activar módulo de juego (Parchís)</span>
                              <div className={`w-14 h-8 rounded-full p-1 transition-colors ${config.enabled ? 'bg-orange-500' : 'bg-neutral-300'}`}>
                                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${config.enabled ? 'translate-x-6' : 'translate-x-0'}`} onClick={(e) => { e.preventDefault(); setConfig({...config, enabled: !config.enabled})}} />
                              </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors bg-white/50 backdrop-blur-sm">
                              <div className="flex items-center gap-2">
                                  <Users className="w-4 h-4 text-neutral-400" />
                                  <span className="font-bold text-neutral-700 text-xs">Permitir modo 4 Jugadores</span>
                              </div>
                              <div className={`w-14 h-8 rounded-full p-1 transition-colors ${config.allow4Players ? 'bg-orange-500' : 'bg-neutral-300'}`}>
                                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${config.allow4Players ? 'translate-x-6' : 'translate-x-0'}`} onClick={(e) => { e.preventDefault(); setConfig({...config, allow4Players: !config.allow4Players})}} />
                              </div>
                          </label>

                          <label className="flex items-center justify-between cursor-pointer p-4 rounded-2xl border border-neutral-100 hover:bg-neutral-50 transition-colors bg-white/50 backdrop-blur-sm">
                              <div className="flex items-center gap-2">
                                  <Users2 className="w-4 h-4 text-neutral-400" />
                                  <span className="font-bold text-neutral-700 text-xs">Permitir modo 6 Jugadores</span>
                              </div>
                              <div className={`w-14 h-8 rounded-full p-1 transition-colors ${config.allow6Players ? 'bg-orange-500' : 'bg-neutral-300'}`}>
                                  <div className={`w-6 h-6 bg-white rounded-full transition-transform ${config.allow6Players ? 'translate-x-6' : 'translate-x-0'}`} onClick={(e) => { e.preventDefault(); setConfig({...config, allow6Players: !config.allow6Players})}} />
                              </div>
                          </label>
                     </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group">
                     <div className="flex items-center gap-4 mb-6 relative z-10">
                          <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                              <Coins className="w-6 h-6 text-amber-600" />
                          </div>
                          <div>
                              <h3 className="text-lg font-black text-neutral-900">Economía e Incentivos</h3>
                              <p className="text-xs text-neutral-500 font-bold">Monedas obtenidas por victoria</p>
                          </div>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="p-3 rounded-xl border border-neutral-100 bg-neutral-50">
                              <label className="block text-[10px] font-bold text-neutral-500 mb-1">Costo Partida</label>
                              <div className="relative">
                                  <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                  <input 
                                     type="number" 
                                     className="w-full pl-8 pr-2 py-2 bg-white outline-none rounded-lg text-xs font-bold border border-neutral-200 focus:border-amber-500 transition-colors"
                                     value={config.costAmount}
                                     onChange={(e) => setConfig({...config, costAmount: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                          </div>

                          <div className="p-3 rounded-xl border border-neutral-100 bg-neutral-50">
                              <label className="block text-[10px] font-bold text-neutral-500 mb-1">1er Premio</label>
                              <div className="relative">
                                  <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-yellow-500" />
                                  <input 
                                     type="number" 
                                     className="w-full pl-8 pr-2 py-2 bg-white outline-none rounded-lg text-xs font-bold border border-neutral-200 focus:border-yellow-500 transition-colors"
                                     value={config.rewardFirstPlace}
                                     onChange={(e) => setConfig({...config, rewardFirstPlace: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                          </div>

                          <div className="p-3 rounded-xl border border-neutral-100 bg-neutral-50">
                              <label className="block text-[10px] font-bold text-neutral-500 mb-1">2do Premio</label>
                              <div className="relative">
                                  <Coins className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                  <input 
                                     type="number" 
                                     className="w-full pl-8 pr-2 py-2 bg-white outline-none rounded-lg text-xs font-bold border border-neutral-200 focus:border-neutral-500 transition-colors"
                                     value={config.rewardSecondPlace}
                                     onChange={(e) => setConfig({...config, rewardSecondPlace: parseInt(e.target.value) || 0})}
                                  />
                              </div>
                          </div>
                     </div>
                </div>
            </div>

            {/* Corner Colors custom mapping */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group">
                 <div className="flex items-center gap-4 mb-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                          <Users2 className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                          <h3 className="text-lg font-black text-neutral-900">Asignación de Colores por Esquina</h3>
                          <p className="text-xs text-neutral-500 font-bold">Asigna qué color de ficha inicia en cada una de las 4 esquinas del tablero para que coincidan con tu diseño personalizado</p>
                      </div>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                          { id: 'bottom-left', label: 'Esquina Inferior Izquierda' },
                          { id: 'bottom-right', label: 'Esquina Inferior Derecha' },
                          { id: 'top-left', label: 'Esquina Superior Izquierda' },
                          { id: 'top-right', label: 'Esquina Superior Derecha' }
                      ].map((corner) => (
                          <div key={corner.id} className="p-3 rounded-xl border border-neutral-100 bg-neutral-50">
                              <label className="block text-[10px] font-bold text-neutral-500 mb-1">{corner.label}</label>
                              <select 
                                  className="w-full bg-white px-2 py-1.5 rounded-lg text-xs font-bold border border-neutral-200 outline-none focus:border-indigo-500 transition-colors"
                                  value={cornerColors[corner.id] || 'red'}
                                  onChange={(e) => setCornerColors(prev => ({ ...prev, [corner.id]: e.target.value }))}
                              >
                                  <option value="red">🔴 Rojo</option>
                                  <option value="blue">🔵 Azul</option>
                                  <option value="yellow">🟡 Amarillo</option>
                                  <option value="green">🟢 Verde</option>
                              </select>
                          </div>
                      ))}
                 </div>
            </div>

            {/* Main Visual Board Mapper Section */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-md p-6 overflow-hidden">
                <div className="flex border-b border-neutral-200 pb-4 mb-6 items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
                            <Eye className="w-5 h-5 text-orange-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-neutral-900">Mapeado Visual del Parqués</h3>
                            <p className="text-xs text-neutral-500">Arrastra los números directamente para ubicarlos o haz clic en uno y presiona en el tablero para reposicionarlo.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            if (window.confirm("¿Seguro que quieres borrar todos los colores/posiciones de Seguros y Salidas? Esto dejará todas las casillas en un estado neutral.")) {
                                setSafeCells([]);
                                setExitCells({});
                            }
                        }}
                        className="px-4 py-2 bg-red-100 text-red-600 font-bold rounded-xl text-xs hover:bg-red-200 transition-colors"
                    >
                        Limpiar Seguros y Salidas
                    </button>
                </div>

                {/* Important Mapping Tips */}
                <div className="mb-6 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex gap-3 text-blue-900">
                    <HelpCircle className="w-6 h-6 flex-shrink-0 text-blue-500" />
                    <div>
                        <h4 className="font-bold text-sm mb-1 text-blue-800">Guía rápida de Mapeo Numérico</h4>
                        <ul className="text-xs space-y-1 list-disc pl-4 text-blue-700 font-medium">
                            <li>El recorrido principal debe ser secuencial del <strong className="font-black">1 al 68</strong> (anillo exterior).</li>
                            <li>Asegúrate de colocar el número correspondiente en cada <strong className="font-black">Casilla de Salida</strong>. Por defecto: Rojo es el <strong className="font-black">5</strong>, Verde es <strong className="font-black">22</strong>, Amarillo es <strong className="font-black">39</strong>, Azul es <strong className="font-black">56</strong>.</li>
                            <li>Los pasillos de meta hacia el centro van del <strong className="font-black">69 al 96</strong> (Rojo: 69-75, Verde: 76-82, Amarillo: 83-89, Azul: 90-96).</li>
                            <li><strong className="text-indigo-600">Tip:</strong> Puedes mapear solo la primera casilla y la última de una recta vacía (ej. 1 y 8), y usar el botón de <strong>Alineación Inteligente</strong> para rellenar y ordenar los huecos automáticamente en línea recta.</li>
                        </ul>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    
                    {/* Column 1: Board Canvas overlay (6-span) */}
                    <div className="lg:col-span-7 flex flex-col items-center">
                        <div className="mb-4 flex items-center justify-between w-full">
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">
                                Vista en vivo del Tablero
                            </span>
                            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                                <HelpCircle className="w-3.5 h-3.5" />
                                ¡Arrastra los círculos directamente sobre el tablero para posicionarlos!
                            </span>
                        </div>

                        {/* Relative Interactive Container */}
                        <div ref={boardContainerRef} className="relative w-full aspect-square max-w-[500px] border border-neutral-200 rounded-3xl bg-neutral-100 shadow-inner overflow-hidden select-none">
                            {/* Board Background */}
                            <img 
                                src={(!config.boardImageUrl || config.boardImageUrl === "/tablero-parques.png") ? "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Parchis_board.svg/1024px-Parchis_board.svg.png" : formatImageUrl(config.boardImageUrl)} 
                                alt="Board Design" 
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                            />
                            
                            {/* Click layer to intercept coords if selected */}
                            <div 
                                onClick={handleBoardClick}
                                className="absolute inset-0 cursor-crosshair z-10"
                            />

                            {/* SVG Loop connecting paths 1..68 directly */}
                            <svg className="absolute inset-0 pointer-events-none z-15 w-full h-full">
                                <polyline
                                    points={Array.from({ length: 68 }, (_, i) => i + 1)
                                        .map(idx => {
                                            const coord = customCoords[idx];
                                            return coord ? `${coord.x}%,${coord.y}%` : '';
                                        })
                                        .filter(x => x !== '')
                                        .join(' ')}
                                    className="stroke-indigo-400 stroke-[2] fill-none stroke-dasharray-[4,4] opacity-45"
                                    style={{
                                        vectorEffect: 'non-scaling-stroke'
                                    }}
                                />
                            </svg>

                            {/* Node Markers overlay (Absolute Positioning & Draggable) */}
                            {Object.entries(customCoords).map(([keyStr, coord]) => {
                                const id = parseInt(keyStr);
                                const isSelected = selectedCellId === id;
                                const isSafe = safeCells.includes(id);
                                
                                return (
                                    <div
                                        key={id}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            setSelectedCellId(id);
                                            setDraggingCellId(id);
                                        }}
                                        onTouchStart={(e) => {
                                            e.stopPropagation();
                                            setSelectedCellId(id);
                                            setDraggingCellId(id);
                                        }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedCellId(id);
                                        }}
                                        className={`absolute w-3.5 h-3.5 -ml-[7px] -mt-[7px] rounded-full flex items-center justify-center font-black text-[7px] cursor-grab active:cursor-grabbing transition-all duration-150 z-20 select-none ${getCellColor(id)}`}
                                        style={{ top: `${coord.y}%`, left: `${coord.x}%` }}
                                    >
                                        {id}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Column 2: Editor Control form (5-span) */}
                    <div className="lg:col-span-5 flex flex-col space-y-6">
                        
                        {/* Selected cell config panel */}
                        <div className="bg-neutral-50 rounded-2xl p-5 border border-neutral-200">
                            <div className="flex items-center justify-between mb-4">
                                <span className="font-bold text-xs text-indigo-700 tracking-wide uppercase">Calibrador De Coordenadas</span>
                                <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1 rounded-full">
                                    Casilla #{selectedCellId}
                                </span>
                            </div>

                            {selectedCellId ? (
                                <div className="space-y-4">
                                    {/* SLIDERS FOR PRECISE TWEAKING */}
                                    <div>
                                        <div className="flex justify-between text-xs text-neutral-600 font-bold mb-1">
                                            <span>X (%) - Desplazamiento Horizontal</span>
                                            <span className="text-neutral-900">{(customCoords[selectedCellId]?.x || 0).toFixed(1)}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            step="0.1"
                                            className="w-full accent-indigo-600 cursor-ew-resize"
                                            value={customCoords[selectedCellId]?.x || 0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setCustomCoords(prev => ({
                                                    ...prev,
                                                    [selectedCellId]: { ...prev[selectedCellId], x: val }
                                                }));
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex justify-between text-xs text-neutral-600 font-bold mb-1">
                                            <span>Y (%) - Desplazamiento Vertical</span>
                                            <span className="text-neutral-900">{(customCoords[selectedCellId]?.y || 0).toFixed(1)}%</span>
                                        </div>
                                        <input 
                                            type="range" 
                                            min="0" 
                                            max="100" 
                                            step="0.1"
                                            className="w-full accent-indigo-600 cursor-ns-resize"
                                            value={customCoords[selectedCellId]?.y || 0}
                                            onChange={(e) => {
                                                const val = parseFloat(e.target.value);
                                                setCustomCoords(prev => ({
                                                    ...prev,
                                                    [selectedCellId]: { ...prev[selectedCellId], y: val }
                                                }));
                                            }}
                                        />
                                    </div>

                                    <div className="border-t border-neutral-200 pt-4 space-y-3">
                                        <label className="flex items-center gap-3 cursor-pointer select-none">
                                            <input 
                                                type="checkbox"
                                                className="rounded border-neutral-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                                                checked={safeCells.includes(selectedCellId)}
                                                onChange={() => toggleSafeCell(selectedCellId)}
                                            />
                                            <span className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                                                <Shield className="w-4 h-4 text-emerald-500" />
                                                Es Seguro (Casilla Protegida)
                                            </span>
                                        </label>

                                        {/* Exit Config for Super Admin */}
                                        <div className="pt-2 bg-white rounded-xl p-3 border border-neutral-100">
                                            <span className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Flag className="w-3.5 h-3.5 text-blue-500" />
                                                Calibrar como Salida
                                            </span>
                                            <div className="grid grid-cols-2 gap-1.5">
                                                {[
                                                    { id: 'bottom-left', label: 'Abajo-Izq' },
                                                    { id: 'bottom-right', label: 'Abajo-Der' },
                                                    { id: 'top-left', label: 'Arriba-Izq' },
                                                    { id: 'top-right', label: 'Arriba-Der' }
                                                ].map(corner => {
                                                    const cColor = cornerColors[corner.id] || 'red';
                                                    let colorName = cColor;
                                                    if (cColor === 'red') colorName = 'Roja';
                                                    if (cColor === 'blue') colorName = 'Azul';
                                                    if (cColor === 'green') colorName = 'Verde';
                                                    if (cColor === 'yellow') colorName = 'Amarilla';
                                                    
                                                    let selectedClasses = 'bg-neutral-500 text-white border-neutral-600';
                                                    if (cColor === 'red') selectedClasses = 'bg-red-500 text-white border-red-600';
                                                    if (cColor === 'green') selectedClasses = 'bg-green-500 text-white border-green-600';
                                                    if (cColor === 'yellow') selectedClasses = 'bg-yellow-500 text-black border-yellow-600 font-extrabold';
                                                    if (cColor === 'blue') selectedClasses = 'bg-blue-500 text-white border-blue-600';

                                                    const isSelected = exitCells[corner.id] === selectedCellId;
                                                    
                                                    return (
                                                        <button
                                                            key={corner.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (isSelected) {
                                                                    const newExits = {...exitCells};
                                                                    delete newExits[corner.id];
                                                                    setExitCells(newExits);
                                                                } else {
                                                                    setExitCells({ ...exitCells, [corner.id]: selectedCellId });
                                                                }
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border truncate transition-all ${isSelected ? selectedClasses : 'bg-neutral-50 text-neutral-600 hover:bg-neutral-100 border-neutral-200'}`}
                                                        >
                                                            Salida {colorName} ({corner.label})
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="pt-4 border-t border-neutral-200 mt-4">
                                        <button
                                            onClick={() => setSelectedCellId(null)}
                                            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 hover:shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check className="w-4 h-4" />
                                            Confirmar Posición y Deseleccionar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-xs text-neutral-400 font-bold">Selecciona una casilla para editar sus coordenadas.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Custom Board Image Upload Form */}
            <div className="bg-white p-6 rounded-3xl border border-neutral-200 shadow-sm relative overflow-hidden group">
                 <div className="flex items-center gap-4 mb-6 relative z-10">
                     <div className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                         <UploadCloud className="w-6 h-6 text-emerald-600" />
                     </div>
                     <div>
                         <h3 className="text-lg font-black text-neutral-900">Personalización de Fondo del Tablero</h3>
                         <p className="text-xs text-neutral-500 font-bold">Cambia el diseño ilustrado de fondo</p>
                     </div>
                 </div>
                 <div className="space-y-4 max-w-xl">
                      <div className="p-4 rounded-2xl border border-neutral-100 bg-white/50 backdrop-blur-sm">
                          <label className="block text-sm font-bold text-neutral-700 mb-2">Imagen del Tablero de Juego</label>
                          <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                              Sube una imagen personalizada para el fondo del tablero. Esta imagen reemplazará el diseño tradicional.
                          </p>
                          
                          <input 
                              type="file"
                              accept="image/*"
                              className="hidden"
                              ref={fileInputRef}
                              onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  
                                  try {
                                      setIsUploadingBoard(true);
                                      const fileName = `board-${Date.now()}-${file.name}`;
                                      const { url, error } = await db.uploadImage(file, `parchis/${fileName}`);
                                      
                                      if (error) throw error;
                                      if (url) {
                                          setConfig({ ...config, boardImageUrl: url });
                                      }
                                  } catch (error) {
                                      console.error("Error al subir la imagen:", error);
                                      alert("Hubo un error al subir la imagen.");
                                  } finally {
                                      setIsUploadingBoard(false);
                                      if (fileInputRef.current) {
                                          fileInputRef.current.value = '';
                                      }
                                  }
                              }}
                          />
                           
                          {!config.boardImageUrl ? (
                              <button
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isUploadingBoard}
                                  className="w-full h-32 border-2 border-dashed border-neutral-300 rounded-xl flex flex-col items-center justify-center text-neutral-500 hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {isUploadingBoard ? (
                                      <Loader2 className="w-8 h-8 mb-2 animate-spin text-emerald-500" />
                                  ) : (
                                      <UploadCloud className="w-8 h-8 mb-2 text-neutral-400 group-hover:text-emerald-500 transition-colors" />
                                  )}
                                  <span className="font-bold text-sm">
                                      {isUploadingBoard ? 'Subiendo imagen...' : 'Click para subir tablero'}
                                  </span>
                                  <span className="text-xs mt-1">PNG, JPG, WEBP (Recomendado 2:1 o Cuadrado)</span>
                              </button>
                          ) : (
                              <div className="relative rounded-xl overflow-hidden border border-neutral-200 bg-neutral-50 p-2 group">
                                  <img src={config.boardImageUrl === "/tablero-parques.png" ? "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Parchis_board.svg/1024px-Parchis_board.svg.png" : formatImageUrl(config.boardImageUrl)} alt="Preview" className="w-full h-auto max-h-[300px] object-contain rounded-lg" />
                                  <div className="absolute inset-x-2 top-2 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button 
                                          onClick={() => setConfig({...config, boardImageUrl: ''})}
                                          className="p-2 bg-red-500 text-white rounded-lg shadow-lg hover:bg-red-600 transition-colors"
                                      >
                                          <X className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>
                          )}
                      </div>
                 </div>
            </div>

        </div>
    );
};
