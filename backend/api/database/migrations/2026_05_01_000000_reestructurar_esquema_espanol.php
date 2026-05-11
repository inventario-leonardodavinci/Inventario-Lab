<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ----------------------------------------------------------------
        // 1. Eliminar triggers y constraints que referencian nombres viejos
        // ----------------------------------------------------------------
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TRIGGER IF EXISTS trg_stock_levels_audit_change ON stock_levels');
            DB::statement('DROP TRIGGER IF EXISTS trg_movements_audit_change ON movements');
            DB::statement('DROP TRIGGER IF EXISTS trg_movement_lines_audit_change ON movement_lines');
            DB::statement('DROP TRIGGER IF EXISTS trg_alert_events_audit_change ON alert_events');
            DB::statement('ALTER TABLE movements DROP CONSTRAINT IF EXISTS movements_movement_type_check');
        }

        // ----------------------------------------------------------------
        // 2. Renombrar tablas (orden respeta FK)
        // ----------------------------------------------------------------
        // Sin FK dependientes primero
        Schema::rename('categories', 'categorias');
        // app_users antes que las tablas que la referencian
        Schema::rename('app_users', 'usuarios_app');
        Schema::rename('locations', 'ubicaciones');
        Schema::rename('items', 'articulos');
        Schema::rename('stock_levels', 'niveles_stock');
        Schema::rename('movements', 'movimientos');
        Schema::rename('movement_lines', 'lineas_movimiento');
        Schema::rename('maintenance_assets', 'activos_mantenimiento');
        Schema::rename('alert_events', 'alertas');
        Schema::rename('audit_logs', 'registros_auditoria');
        // Tabla pivote al final
        Schema::rename('app_user_roles', 'usuario_roles');

        // ----------------------------------------------------------------
        // 3. Renombrar columnas — usuarios_app
        // ----------------------------------------------------------------
        Schema::table('usuarios_app', function ($table) {
            $table->renameColumn('display_name', 'nombre_visible');
            $table->renameColumn('is_active', 'activo');
        });

        // ----------------------------------------------------------------
        // 4. Renombrar columnas — usuario_roles
        // ----------------------------------------------------------------
        Schema::table('usuario_roles', function ($table) {
            $table->renameColumn('app_user_id', 'usuario_id');
            $table->renameColumn('role_id', 'rol_id');
        });

        // ----------------------------------------------------------------
        // 5. Renombrar columnas — categorias
        // ----------------------------------------------------------------
        Schema::table('categorias', function ($table) {
            $table->renameColumn('name', 'nombre');
        });

        // ----------------------------------------------------------------
        // 6. Renombrar columnas + añadir nuevas — ubicaciones
        // ----------------------------------------------------------------
        Schema::table('ubicaciones', function ($table) {
            $table->renameColumn('name', 'nombre');
            $table->text('descripcion')->nullable()->after('nombre');
            $table->string('tipo', 30)->nullable()->after('descripcion');
        });

        // ----------------------------------------------------------------
        // 7. Renombrar columnas + añadir nuevas — articulos
        // ----------------------------------------------------------------
        Schema::table('articulos', function ($table) {
            $table->renameColumn('code', 'codigo');
            $table->renameColumn('name', 'nombre');
            $table->renameColumn('category_id', 'categoria_id');
            $table->renameColumn('unit', 'unidad');
            $table->renameColumn('notes', 'notas');
            $table->renameColumn('is_active', 'activo');
            $table->text('descripcion')->nullable()->after('nombre');
        });

        // ----------------------------------------------------------------
        // 8. Renombrar columnas — niveles_stock
        // ----------------------------------------------------------------
        Schema::table('niveles_stock', function ($table) {
            $table->renameColumn('item_id', 'articulo_id');
            $table->renameColumn('location_id', 'ubicacion_id');
            $table->renameColumn('quantity', 'cantidad');
            $table->renameColumn('min_quantity', 'cantidad_minima');
        });

        // ----------------------------------------------------------------
        // 9. Renombrar columnas — movimientos
        // ----------------------------------------------------------------
        Schema::table('movimientos', function ($table) {
            $table->renameColumn('movement_type', 'tipo');
            $table->renameColumn('reason', 'motivo');
            $table->renameColumn('source_location_id', 'ubicacion_origen_id');
            $table->renameColumn('target_location_id', 'ubicacion_destino_id');
            $table->renameColumn('app_user_id', 'usuario_id');
        });

        // ----------------------------------------------------------------
        // 10. Renombrar columnas — lineas_movimiento
        // ----------------------------------------------------------------
        Schema::table('lineas_movimiento', function ($table) {
            $table->renameColumn('movement_id', 'movimiento_id');
            $table->renameColumn('item_id', 'articulo_id');
            $table->renameColumn('quantity', 'cantidad');
        });

        // ----------------------------------------------------------------
        // 11. Renombrar columnas — activos_mantenimiento
        // ----------------------------------------------------------------
        Schema::table('activos_mantenimiento', function ($table) {
            $table->renameColumn('asset_code', 'codigo_activo');
            $table->renameColumn('serial_number', 'numero_serie');
            $table->renameColumn('status', 'estado');
            $table->renameColumn('current_location_id', 'ubicacion_actual_id');
            $table->renameColumn('item_id', 'articulo_id');
        });

        // ----------------------------------------------------------------
        // 12. Renombrar columnas — alertas
        // ----------------------------------------------------------------
        Schema::table('alertas', function ($table) {
            $table->renameColumn('alert_type', 'tipo');
            $table->renameColumn('severity', 'severidad');
            $table->renameColumn('status', 'estado');
            $table->renameColumn('item_id', 'articulo_id');
            $table->renameColumn('location_id', 'ubicacion_id');
            $table->renameColumn('asset_id', 'activo_id');
            $table->renameColumn('trigger_payload_json', 'datos_json');
            $table->renameColumn('triggered_at', 'generada_en');
            $table->renameColumn('acknowledged_by_user_id', 'confirmada_por_id');
            $table->renameColumn('acknowledged_at', 'confirmada_en');
            $table->renameColumn('resolution_notes', 'notas_resolucion');
        });

        // ----------------------------------------------------------------
        // 13. Renombrar columnas — registros_auditoria
        // ----------------------------------------------------------------
        Schema::table('registros_auditoria', function ($table) {
            $table->renameColumn('actor_user_id', 'usuario_id');
            $table->renameColumn('event_type', 'tipo_evento');
            $table->renameColumn('entity_type', 'entidad_tipo');
            $table->renameColumn('entity_id', 'entidad_id');
            $table->renameColumn('before_json', 'antes_json');
            $table->renameColumn('after_json', 'despues_json');
        });

        // ----------------------------------------------------------------
        // 14. Migrar datos de enums — movimientos.tipo
        // ----------------------------------------------------------------
        DB::statement("UPDATE movimientos SET tipo = 'entrada'  WHERE tipo = 'entry'");
        DB::statement("UPDATE movimientos SET tipo = 'salida'   WHERE tipo = 'exit'");
        DB::statement("UPDATE movimientos SET tipo = 'traslado' WHERE tipo = 'transfer'");
        DB::statement("UPDATE movimientos SET tipo = 'ajuste'   WHERE tipo = 'adjustment'");

        // ----------------------------------------------------------------
        // 15. Migrar datos de enums — alertas.estado
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET estado = 'abierta'    WHERE estado = 'open'");
        DB::statement("UPDATE alertas SET estado = 'confirmada' WHERE estado = 'acknowledged'");
        DB::statement("UPDATE alertas SET estado = 'resuelta'   WHERE estado = 'resolved'");
        DB::statement("UPDATE alertas SET estado = 'ignorada'   WHERE estado = 'ignored'");

        // ----------------------------------------------------------------
        // 16. Migrar datos de enums — alertas.tipo
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET tipo = 'stock_bajo'   WHERE tipo = 'low_stock'");
        DB::statement("UPDATE alertas SET tipo = 'caducidad'    WHERE tipo = 'expiry'");
        DB::statement("UPDATE alertas SET tipo = 'mantenimiento' WHERE tipo = 'maintenance'");
        DB::statement("UPDATE alertas SET tipo = 'inactividad'  WHERE tipo = 'inactivity'");

        // ----------------------------------------------------------------
        // 17. Migrar datos de enums — alertas.severidad
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET severidad = 'baja'   WHERE severidad = 'low'");
        DB::statement("UPDATE alertas SET severidad = 'media'  WHERE severidad = 'medium'");
        DB::statement("UPDATE alertas SET severidad = 'alta'   WHERE severidad = 'high'");
        DB::statement("UPDATE alertas SET severidad = 'critica' WHERE severidad = 'critical'");

        // ----------------------------------------------------------------
        // 18. Migrar datos de enums — activos_mantenimiento.estado
        // ----------------------------------------------------------------
        DB::statement("UPDATE activos_mantenimiento SET estado = 'operativo'               WHERE estado = 'operational'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'mantenimiento_pendiente' WHERE estado = 'maintenance_pending'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'en_mantenimiento'        WHERE estado = 'under_maintenance'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'fuera_servicio'          WHERE estado = 'out_of_service'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'retirado'                WHERE estado = 'retired'");

        // ----------------------------------------------------------------
        // 19. Añadir constraints CHECK con valores en español
        // ----------------------------------------------------------------
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE movimientos ADD CONSTRAINT movimientos_tipo_check CHECK (tipo IN ('entrada','salida','traslado','ajuste'))");
            DB::statement("ALTER TABLE ubicaciones ADD CONSTRAINT ubicaciones_tipo_check CHECK (tipo IN ('armario','nevera','estanteria','cajon','vitrina','otro'))");
        }
    }

    public function down(): void
    {
        // ----------------------------------------------------------------
        // 1. Eliminar constraints CHECK en español
        // ----------------------------------------------------------------
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE movimientos DROP CONSTRAINT IF EXISTS movimientos_tipo_check');
            DB::statement('ALTER TABLE ubicaciones DROP CONSTRAINT IF EXISTS ubicaciones_tipo_check');
        }

        // ----------------------------------------------------------------
        // 2. Revertir datos de enums — activos_mantenimiento.estado
        // ----------------------------------------------------------------
        DB::statement("UPDATE activos_mantenimiento SET estado = 'operational'          WHERE estado = 'operativo'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'maintenance_pending'  WHERE estado = 'mantenimiento_pendiente'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'under_maintenance'    WHERE estado = 'en_mantenimiento'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'out_of_service'       WHERE estado = 'fuera_servicio'");
        DB::statement("UPDATE activos_mantenimiento SET estado = 'retired'              WHERE estado = 'retirado'");

        // ----------------------------------------------------------------
        // 3. Revertir datos de enums — alertas.severidad
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET severidad = 'low'      WHERE severidad = 'baja'");
        DB::statement("UPDATE alertas SET severidad = 'medium'   WHERE severidad = 'media'");
        DB::statement("UPDATE alertas SET severidad = 'high'     WHERE severidad = 'alta'");
        DB::statement("UPDATE alertas SET severidad = 'critical' WHERE severidad = 'critica'");

        // ----------------------------------------------------------------
        // 4. Revertir datos de enums — alertas.tipo
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET tipo = 'low_stock'    WHERE tipo = 'stock_bajo'");
        DB::statement("UPDATE alertas SET tipo = 'expiry'       WHERE tipo = 'caducidad'");
        DB::statement("UPDATE alertas SET tipo = 'maintenance'  WHERE tipo = 'mantenimiento'");
        DB::statement("UPDATE alertas SET tipo = 'inactivity'   WHERE tipo = 'inactividad'");

        // ----------------------------------------------------------------
        // 5. Revertir datos de enums — alertas.estado
        // ----------------------------------------------------------------
        DB::statement("UPDATE alertas SET estado = 'open'         WHERE estado = 'abierta'");
        DB::statement("UPDATE alertas SET estado = 'acknowledged' WHERE estado = 'confirmada'");
        DB::statement("UPDATE alertas SET estado = 'resolved'     WHERE estado = 'resuelta'");
        DB::statement("UPDATE alertas SET estado = 'ignored'      WHERE estado = 'ignorada'");

        // ----------------------------------------------------------------
        // 6. Revertir datos de enums — movimientos.tipo
        // ----------------------------------------------------------------
        DB::statement("UPDATE movimientos SET tipo = 'entry'      WHERE tipo = 'entrada'");
        DB::statement("UPDATE movimientos SET tipo = 'exit'       WHERE tipo = 'salida'");
        DB::statement("UPDATE movimientos SET tipo = 'transfer'   WHERE tipo = 'traslado'");
        DB::statement("UPDATE movimientos SET tipo = 'adjustment' WHERE tipo = 'ajuste'");

        // ----------------------------------------------------------------
        // 7. Revertir columnas — registros_auditoria
        // ----------------------------------------------------------------
        Schema::table('registros_auditoria', function ($table) {
            $table->renameColumn('usuario_id', 'actor_user_id');
            $table->renameColumn('tipo_evento', 'event_type');
            $table->renameColumn('entidad_tipo', 'entity_type');
            $table->renameColumn('entidad_id', 'entity_id');
            $table->renameColumn('antes_json', 'before_json');
            $table->renameColumn('despues_json', 'after_json');
        });

        // ----------------------------------------------------------------
        // 8. Revertir columnas — alertas
        // ----------------------------------------------------------------
        Schema::table('alertas', function ($table) {
            $table->renameColumn('tipo', 'alert_type');
            $table->renameColumn('severidad', 'severity');
            $table->renameColumn('estado', 'status');
            $table->renameColumn('articulo_id', 'item_id');
            $table->renameColumn('ubicacion_id', 'location_id');
            $table->renameColumn('activo_id', 'asset_id');
            $table->renameColumn('datos_json', 'trigger_payload_json');
            $table->renameColumn('generada_en', 'triggered_at');
            $table->renameColumn('confirmada_por_id', 'acknowledged_by_user_id');
            $table->renameColumn('confirmada_en', 'acknowledged_at');
            $table->renameColumn('notas_resolucion', 'resolution_notes');
        });

        // ----------------------------------------------------------------
        // 9. Revertir columnas — activos_mantenimiento
        // ----------------------------------------------------------------
        Schema::table('activos_mantenimiento', function ($table) {
            $table->renameColumn('codigo_activo', 'asset_code');
            $table->renameColumn('numero_serie', 'serial_number');
            $table->renameColumn('estado', 'status');
            $table->renameColumn('ubicacion_actual_id', 'current_location_id');
            $table->renameColumn('articulo_id', 'item_id');
        });

        // ----------------------------------------------------------------
        // 10. Revertir columnas — lineas_movimiento
        // ----------------------------------------------------------------
        Schema::table('lineas_movimiento', function ($table) {
            $table->renameColumn('movimiento_id', 'movement_id');
            $table->renameColumn('articulo_id', 'item_id');
            $table->renameColumn('cantidad', 'quantity');
        });

        // ----------------------------------------------------------------
        // 11. Revertir columnas — movimientos
        // ----------------------------------------------------------------
        Schema::table('movimientos', function ($table) {
            $table->renameColumn('tipo', 'movement_type');
            $table->renameColumn('motivo', 'reason');
            $table->renameColumn('ubicacion_origen_id', 'source_location_id');
            $table->renameColumn('ubicacion_destino_id', 'target_location_id');
            $table->renameColumn('usuario_id', 'app_user_id');
        });

        // ----------------------------------------------------------------
        // 12. Revertir columnas — niveles_stock
        // ----------------------------------------------------------------
        Schema::table('niveles_stock', function ($table) {
            $table->renameColumn('articulo_id', 'item_id');
            $table->renameColumn('ubicacion_id', 'location_id');
            $table->renameColumn('cantidad', 'quantity');
            $table->renameColumn('cantidad_minima', 'min_quantity');
        });

        // ----------------------------------------------------------------
        // 13. Revertir columnas + eliminar nuevas — articulos
        // ----------------------------------------------------------------
        Schema::table('articulos', function ($table) {
            $table->renameColumn('codigo', 'code');
            $table->renameColumn('nombre', 'name');
            $table->renameColumn('categoria_id', 'category_id');
            $table->renameColumn('unidad', 'unit');
            $table->renameColumn('notas', 'notes');
            $table->renameColumn('activo', 'is_active');
            $table->dropColumn('descripcion');
        });

        // ----------------------------------------------------------------
        // 14. Revertir columnas + eliminar nuevas — ubicaciones
        // ----------------------------------------------------------------
        Schema::table('ubicaciones', function ($table) {
            $table->renameColumn('nombre', 'name');
            $table->dropColumn('descripcion');
            $table->dropColumn('tipo');
        });

        // ----------------------------------------------------------------
        // 15. Revertir columnas — categorias
        // ----------------------------------------------------------------
        Schema::table('categorias', function ($table) {
            $table->renameColumn('nombre', 'name');
        });

        // ----------------------------------------------------------------
        // 16. Revertir columnas — usuario_roles
        // ----------------------------------------------------------------
        Schema::table('usuario_roles', function ($table) {
            $table->renameColumn('usuario_id', 'app_user_id');
            $table->renameColumn('rol_id', 'role_id');
        });

        // ----------------------------------------------------------------
        // 17. Revertir columnas — usuarios_app
        // ----------------------------------------------------------------
        Schema::table('usuarios_app', function ($table) {
            $table->renameColumn('nombre_visible', 'display_name');
            $table->renameColumn('activo', 'is_active');
        });

        // ----------------------------------------------------------------
        // 18. Revertir renombrado de tablas (orden inverso)
        // ----------------------------------------------------------------
        Schema::rename('usuario_roles', 'app_user_roles');
        Schema::rename('registros_auditoria', 'audit_logs');
        Schema::rename('alertas', 'alert_events');
        Schema::rename('activos_mantenimiento', 'maintenance_assets');
        Schema::rename('lineas_movimiento', 'movement_lines');
        Schema::rename('movimientos', 'movements');
        Schema::rename('niveles_stock', 'stock_levels');
        Schema::rename('articulos', 'items');
        Schema::rename('ubicaciones', 'locations');
        Schema::rename('usuarios_app', 'app_users');
        Schema::rename('categorias', 'categories');

        // ----------------------------------------------------------------
        // 19. Restaurar constraint CHECK original en movements
        // ----------------------------------------------------------------
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE movements ADD CONSTRAINT movements_movement_type_check CHECK (movement_type IN ('entry','exit','transfer','adjustment'))");
        }
    }
};
