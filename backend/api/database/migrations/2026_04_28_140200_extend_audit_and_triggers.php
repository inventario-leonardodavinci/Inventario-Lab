<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('audit_logs', function (Blueprint $table) {
            $table->jsonb('before_json')->nullable();
            $table->jsonb('after_json')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->text('user_agent')->nullable();
        });

        if (DB::getDriverName() === 'pgsql') {
            DB::statement(<<<'SQL'
CREATE OR REPLACE FUNCTION fn_audit_row_change()
RETURNS TRIGGER AS $$
DECLARE
  action_type TEXT;
  row_id BIGINT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    action_type := TG_TABLE_NAME || '.insert';
    row_id := NEW.id;
    INSERT INTO audit_logs (event_type, entity_type, entity_id, after_json, payload_json, created_at)
    VALUES (action_type, TG_TABLE_NAME, row_id, to_jsonb(NEW), jsonb_build_object('source', 'trigger'), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    action_type := TG_TABLE_NAME || '.update';
    row_id := NEW.id;
    INSERT INTO audit_logs (event_type, entity_type, entity_id, before_json, after_json, payload_json, created_at)
    VALUES (action_type, TG_TABLE_NAME, row_id, to_jsonb(OLD), to_jsonb(NEW), jsonb_build_object('source', 'trigger'), NOW());
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    action_type := TG_TABLE_NAME || '.delete';
    row_id := OLD.id;
    INSERT INTO audit_logs (event_type, entity_type, entity_id, before_json, payload_json, created_at)
    VALUES (action_type, TG_TABLE_NAME, row_id, to_jsonb(OLD), jsonb_build_object('source', 'trigger'), NOW());
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
SQL);

            DB::statement('DROP TRIGGER IF EXISTS trg_stock_levels_audit_change ON stock_levels');
            DB::statement('CREATE TRIGGER trg_stock_levels_audit_change AFTER INSERT OR UPDATE OR DELETE ON stock_levels FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change()');
            DB::statement('DROP TRIGGER IF EXISTS trg_movements_audit_change ON movements');
            DB::statement('CREATE TRIGGER trg_movements_audit_change AFTER INSERT OR UPDATE OR DELETE ON movements FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change()');
            DB::statement('DROP TRIGGER IF EXISTS trg_movement_lines_audit_change ON movement_lines');
            DB::statement('CREATE TRIGGER trg_movement_lines_audit_change AFTER INSERT OR UPDATE OR DELETE ON movement_lines FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change()');
            DB::statement('DROP TRIGGER IF EXISTS trg_maintenance_events_audit_change ON maintenance_events');
            DB::statement('CREATE TRIGGER trg_maintenance_events_audit_change AFTER INSERT OR UPDATE OR DELETE ON maintenance_events FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change()');
            DB::statement('DROP TRIGGER IF EXISTS trg_alert_events_audit_change ON alert_events');
            DB::statement('CREATE TRIGGER trg_alert_events_audit_change AFTER INSERT OR UPDATE OR DELETE ON alert_events FOR EACH ROW EXECUTE FUNCTION fn_audit_row_change()');
        }
    }

    public function down(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP TRIGGER IF EXISTS trg_alert_events_audit_change ON alert_events');
            DB::statement('DROP TRIGGER IF EXISTS trg_maintenance_events_audit_change ON maintenance_events');
            DB::statement('DROP TRIGGER IF EXISTS trg_movement_lines_audit_change ON movement_lines');
            DB::statement('DROP TRIGGER IF EXISTS trg_movements_audit_change ON movements');
            DB::statement('DROP TRIGGER IF EXISTS trg_stock_levels_audit_change ON stock_levels');

            DB::statement('DROP FUNCTION IF EXISTS fn_audit_row_change()');
        }

        Schema::table('audit_logs', function (Blueprint $table) {
            $table->dropColumn(['before_json', 'after_json', 'ip_address', 'user_agent']);
        });
    }
};
