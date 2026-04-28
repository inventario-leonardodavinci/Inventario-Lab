<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('name', 50)->unique();
            $table->timestamps();
        });

        Schema::create('app_users', function (Blueprint $table) {
            $table->id();
            $table->text('auth_user_id')->unique();
            $table->string('display_name', 120)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('app_user_roles', function (Blueprint $table) {
            $table->foreignId('app_user_id')->constrained('app_users')->cascadeOnDelete();
            $table->foreignId('role_id')->constrained('roles')->cascadeOnDelete();
            $table->primary(['app_user_id', 'role_id']);
        });

        Schema::create('categories', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name', 100)->unique();
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->id();
            $table->string('code', 100)->nullable()->unique();
            $table->string('name', 180);
            $table->foreignId('category_id')->constrained('categories');
            $table->string('material_type', 60)->nullable();
            $table->decimal('capacity_ml', 10, 2)->nullable();
            $table->string('unit', 40)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('stock_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('location_id')->constrained('locations');
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('min_quantity', 12, 2)->default(0);
            $table->timestamps();
            $table->unique(['item_id', 'location_id']);
        });

        Schema::create('movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_type', 20);
            $table->string('reason', 255)->nullable();
            $table->foreignId('source_location_id')->nullable()->constrained('locations');
            $table->foreignId('target_location_id')->nullable()->constrained('locations');
            $table->foreignId('app_user_id')->constrained('app_users');
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('movement_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movement_id')->constrained('movements')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->decimal('quantity', 12, 2);
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::create('maintenance_assets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->string('asset_code', 100)->unique();
            $table->string('serial_number', 120)->nullable();
            $table->string('status', 30)->default('operational');
            $table->foreignId('current_location_id')->nullable()->constrained('locations');
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('alert_events', function (Blueprint $table) {
            $table->id();
            $table->string('alert_type', 30);
            $table->string('severity', 20)->default('medium');
            $table->string('status', 20)->default('open');
            $table->foreignId('item_id')->nullable()->constrained('items');
            $table->foreignId('location_id')->nullable()->constrained('locations');
            $table->foreignId('asset_id')->nullable()->constrained('maintenance_assets');
            $table->jsonb('trigger_payload_json')->nullable();
            $table->timestampTz('triggered_at')->useCurrent();
            $table->foreignId('acknowledged_by_user_id')->nullable()->constrained('app_users');
            $table->timestampTz('acknowledged_at')->nullable();
            $table->text('resolution_notes')->nullable();
            $table->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('app_users');
            $table->string('event_type', 80);
            $table->string('entity_type', 80);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->jsonb('before_json')->nullable();
            $table->jsonb('after_json')->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        DB::statement("ALTER TABLE movements ADD CONSTRAINT movements_movement_type_check CHECK (movement_type IN ('entry','exit','transfer','adjustment'))");
        DB::statement('ALTER TABLE stock_levels ADD CONSTRAINT stock_levels_quantity_non_negative_chk CHECK (quantity >= 0)');
        DB::statement('ALTER TABLE movement_lines ADD CONSTRAINT movement_lines_quantity_positive_chk CHECK (quantity > 0)');
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('alert_events');
        Schema::dropIfExists('maintenance_assets');
        Schema::dropIfExists('movement_lines');
        Schema::dropIfExists('movements');
        Schema::dropIfExists('stock_levels');
        Schema::dropIfExists('items');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('app_user_roles');
        Schema::dropIfExists('app_users');
        Schema::dropIfExists('roles');
    }
};
