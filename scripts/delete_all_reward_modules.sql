-- ==============================================================================
-- ELIMINAR TODOS LOS MÓDULOS DE RECOMPENSAS (INICIO) EN SUPABASE
-- ==============================================================================
-- Este script vacía completamente la tabla reward_modules para que no aparezca
-- ningún módulo en la pantalla principal (Home).

DELETE FROM public.reward_modules;

SELECT '¡Todos los módulos de recompensas han sido eliminados de la base de datos!' AS resultado;
