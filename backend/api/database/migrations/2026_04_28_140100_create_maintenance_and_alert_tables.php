<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('suppliers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 180)->unique();
            $table->string('tax_id', 80)->nullable();
            $table->string('contact_name', 120)->nullable();
            $table->string('contact_email', 180)->nullable();
            $table->string('contact_phone', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_suppliers_tax_id ON suppliers(tax_id) WHERE tax_id IS NOT NULL');

        Schema::table('batches', function (Blueprint $table) {
            $table->foreignId('supplier_id')->nullable()->constrained('suppliers');
        });

        Schema::create('maintenance_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->string('asset_code', 100)->unique();
            $table->string('serial_number', 120)->nullable();
            $table->string('status', 30)->default('operational');
            $table->string('manufacturer', 120)->nullable();
            $table->string('model', 120)->nullable();
            $table->date('purchase_date')->nullable();
            $table->date('warranty_end_date')->nullable();
            $table->date('last_service_date')->nullable();
            $table->date('next_service_due_date')->nullable();
            $table->foreignId('current_location_id')->nullable()->constrained('locations');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE maintenance_assets ADD CONSTRAINT maintenance_assets_status_chk CHECK (status IN ('operational', 'maintenance_due', 'in_maintenance', 'out_of_service', 'retired'))");
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_maintenance_assets_serial_number ON maintenance_assets(serial_number) WHERE serial_number IS NOT NULL');

        Schema::create('maintenance_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name', 160);
            $table->foreignId('asset_id')->constrained('maintenance_assets')->cascadeOnDelete();
            $table->integer('periodicity_days');
            $table->boolean('is_active')->default(true);
            $table->jsonb('checklist_json')->nullable();
            $table->timestamps();
            $table->unique(['asset_id', 'name']);
        });
        DB::statement('ALTER TABLE maintenance_plans ADD CONSTRAINT maintenance_plans_periodicity_days_chk CHECK (periodicity_days > 0)');

        Schema::create('maintenance_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('asset_id')->constrained('maintenance_assets')->cascadeOnDelete();
            $table->foreignId('maintenance_plan_id')->nullable()->constrained('maintenance_plans')->nullOnDelete();
            $table->string('event_type', 30);
            $table->string('status', 30)->default('scheduled');
            $table->string('priority', 20)->default('medium');
            $table->timestampTz('started_at')->nullable();
            $table->timestampTz('completed_at')->nullable();
            $table->foreignId('performed_by_user_id')->nullable()->constrained('app_users');
            $table->foreignId('vendor_supplier_id')->nullable()->constrained('suppliers');
            $table->text('findings')->nullable();
            $table->text('actions_taken')->nullable();
            $table->integer('downtime_minutes')->nullable();
            $table->decimal('cost_amount', 12, 2)->nullable();
            $table->jsonb('attachments_json')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_type_chk CHECK (event_type IN ('preventive', 'corrective', 'inspection', 'calibration'))");
        DB::statement("ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_status_chk CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled'))");
        DB::statement("ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_priority_chk CHECK (priority IN ('low', 'medium', 'high', 'critical'))");
        DB::statement('ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_downtime_chk CHECK (downtime_minutes IS NULL OR downtime_minutes >= 0)');
        DB::statement('ALTER TABLE maintenance_events ADD CONSTRAINT maintenance_events_cost_chk CHECK (cost_amount IS NULL OR cost_amount >= 0)');

        Schema::create('alert_rules', function (Blueprint $table) {
            $table->id();
            $table->string('rule_code', 80)->unique();
            $table->string('name', 150);
            $table->string('alert_type', 30);
            $table->string('severity', 20)->default('medium');
            $table->string('scope_type', 20);
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->foreignId('location_id')->nullable()->constrained('locations');
            $table->foreignId('asset_id')->nullable()->constrained('maintenance_assets');
            $table->decimal('threshold_numeric', 12, 2)->nullable();
            $table->integer('threshold_days')->nullable();
            $table->boolean('is_active')->default(true);
            $table->jsonb('notification_channels_json')->nullable();
            $table->foreignId('created_by_user_id')->nullable()->constrained('app_users');
            $table->timestamps();
        });
        DB::statement("ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_type_chk CHECK (alert_type IN ('low_stock', 'expiration', 'maintenance_due', 'stock_inactivity'))");
        DB::statement("ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_severity_chk CHECK (severity IN ('low', 'medium', 'high', 'critical'))");
        DB::statement("ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_scope_chk CHECK (scope_type IN ('item', 'location', 'asset', 'global'))");
        DB::statement('ALTER TABLE alert_rules ADD CONSTRAINT alert_rules_threshold_days_chk CHECK (threshold_days IS NULL OR threshold_days >= 0)');

        Schema::create('alert_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_rule_id')->nullable()->constrained('alert_rules')->nullOnDelete();
            $table->string('alert_type', 30);
            $table->string('severity', 20);
            $table->string('status', 20)->default('open');
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->foreignId('location_id')->nullable()->constrained('locations');
            $table->foreignId('asset_id')->nullable()->constrained('maintenance_assets');
            $table->jsonb('trigger_payload_json')->nullable();
            $table->timestampTz('triggered_at')->useCurrent();
            $table->timestampTz('acknowledged_at')->nullable();
            $table->foreignId('acknowledged_by_user_id')->nullable()->constrained('app_users');
            $table->timestampTz('resolved_at')->nullable();
            $table->foreignId('resolved_by_user_id')->nullable()->constrained('app_users');
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });
        DB::statement("ALTER TABLE alert_events ADD CONSTRAINT alert_events_type_chk CHECK (alert_type IN ('low_stock', 'expiration', 'maintenance_due', 'stock_inactivity'))");
        DB::statement("ALTER TABLE alert_events ADD CONSTRAINT alert_events_severity_chk CHECK (severity IN ('low', 'medium', 'high', 'critical'))");
        DB::statement("ALTER TABLE alert_events ADD CONSTRAINT alert_events_status_chk CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored'))");

        Schema::create('alert_notifications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('alert_event_id')->constrained('alert_events')->cascadeOnDelete();
            $table->string('channel', 30);
            $table->string('recipient', 180)->nullable();
            $table->string('status', 20)->default('pending');
            $table->jsonb('provider_response_json')->nullable();
            $table->timestampTz('sent_at')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });
        DB::statement("ALTER TABLE alert_notifications ADD CONSTRAINT alert_notifications_channel_chk CHECK (channel IN ('in_app', 'email', 'webhook'))");
        DB::statement("ALTER TABLE alert_notifications ADD CONSTRAINT alert_notifications_status_chk CHECK (status IN ('pending', 'sent', 'failed'))");
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_notifications');
        Schema::dropIfExists('alert_events');
        Schema::dropIfExists('alert_rules');
        Schema::dropIfExists('maintenance_events');
        Schema::dropIfExists('maintenance_plans');
        Schema::dropIfExists('maintenance_assets');
        Schema::table('batches', function (Blueprint $table) {
            $table->dropConstrainedForeignId('supplier_id');
        });
        Schema::dropIfExists('suppliers');
    }
};
