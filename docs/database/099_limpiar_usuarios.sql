-- Script SQL para limpiar usuarios y datos relacionados
-- ⚠️  Ejecutar con precaución - esto elimina datos permanentemente

-- Opción 1: Limpieza completa (eliminar TODO - incluyendo movimientos)
-- =====================================================

BEGIN;

-- 1. Eliminar roles de usuarios
DELETE FROM usuario_roles WHERE usuario_id IN (SELECT id FROM usuarios_app);

-- 2. Eliminar historial de sesiones
DELETE FROM historial_sesiones WHERE usuario_id IN (SELECT id FROM usuarios_app);

-- 3. Eliminar registros de auditoría
DELETE FROM registros_auditoria WHERE usuario_id IN (SELECT id FROM usuarios_app);

-- 4. Eliminar movimientos (primero líneas, luego movimientos)
DELETE FROM lineas_movimiento 
WHERE movimiento_id IN (SELECT id FROM movimientos WHERE usuario_id IN (SELECT id FROM usuarios_app));

DELETE FROM movimientos WHERE usuario_id IN (SELECT id FROM usuarios_app);

-- 5. Finalmente, eliminar los usuarios
DELETE FROM usuarios_app;

COMMIT;

-- Opción 2: Solo desactivar usuarios (conservar datos)
-- =====================================================
-- UPDATE usuarios_app SET activo = false;

-- Opción 3: Eliminar solo usuarios inactivos (con sus datos)
-- =====================================================
-- DELETE FROM usuario_roles WHERE usuario_id IN (SELECT id FROM usuarios_app WHERE activo = false);
-- DELETE FROM historial_sesiones WHERE usuario_id IN (SELECT id FROM usuarios_app WHERE activo = false);
-- DELETE FROM registros_auditoria WHERE usuario_id IN (SELECT id FROM usuarios_app WHERE activo = false);
-- DELETE FROM lineas_movimiento WHERE movimiento_id IN (SELECT id FROM movimientos WHERE usuario_id IN (SELECT id FROM usuarios_app WHERE activo = false));
-- DELETE FROM movimientos WHERE usuario_id IN (SELECT id FROM usuarios_app WHERE activo = false);
-- DELETE FROM usuarios_app WHERE activo = false;
