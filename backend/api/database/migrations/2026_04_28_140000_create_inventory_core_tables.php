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
            $table->string('serial_number', 120)->nullable();
            $table->string('name', 180);
            $table->string('material_type', 60)->nullable();
            $table->decimal('capacity_ml', 10, 2)->nullable();
            $table->date('expiration_date')->nullable();
            $table->foreignId('category_id')->constrained('categories');
            $table->string('unit', 40)->nullable();
            $table->text('notes')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['name', 'material_type', 'capacity_ml', 'category_id'], 'items_name_material_capacity_category_key');
        });
        DB::statement('CREATE UNIQUE INDEX IF NOT EXISTS uq_items_serial_number ON items(serial_number) WHERE serial_number IS NOT NULL');

        Schema::create('batches', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->string('lot_number', 100)->nullable();
            $table->date('expiration_date')->nullable();
            $table->decimal('unit_cost', 10, 2)->nullable();
            $table->timestamps();
        });

        Schema::create('stock_levels', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('location_id')->constrained('locations');
            $table->decimal('quantity', 12, 2)->default(0);
            $table->decimal('min_quantity', 12, 2)->nullable();
            $table->timestamps();
            $table->unique(['item_id', 'location_id']);
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE stock_levels ADD CONSTRAINT stock_levels_quantity_non_negative_chk CHECK (quantity >= 0)');
        }

        Schema::create('movements', function (Blueprint $table) {
            $table->id();
            $table->string('movement_type', 20);
            $table->string('reason', 255)->nullable();
            $table->foreignId('source_location_id')->nullable()->constrained('locations');
            $table->foreignId('target_location_id')->nullable()->constrained('locations');
            $table->foreignId('app_user_id')->constrained('app_users');
            $table->timestampTz('created_at')->useCurrent();
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement("ALTER TABLE movements ADD CONSTRAINT movements_type_chk CHECK (movement_type IN ('entry', 'exit', 'transfer', 'adjustment'))");
        }

        Schema::create('movement_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('movement_id')->constrained('movements')->cascadeOnDelete();
            $table->foreignId('item_id')->constrained('items');
            $table->foreignId('batch_id')->nullable()->constrained('batches');
            $table->decimal('quantity', 12, 2);
            $table->timestampTz('created_at')->useCurrent();
        });
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('ALTER TABLE movement_lines ADD CONSTRAINT movement_lines_quantity_positive_chk CHECK (quantity > 0)');
        }

        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('actor_user_id')->nullable()->constrained('app_users');
            $table->string('event_type', 80);
            $table->string('entity_type', 80);
            $table->unsignedBigInteger('entity_id')->nullable();
            $table->jsonb('payload_json')->nullable();
            $table->timestampTz('created_at')->useCurrent();
        });

        Schema::table('items', function (Blueprint $table) {
            $table->index('category_id', 'idx_items_category');
            $table->index('name', 'idx_items_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('movement_lines');
        Schema::dropIfExists('movements');
        Schema::dropIfExists('stock_levels');
        Schema::dropIfExists('batches');
        Schema::dropIfExists('items');
        Schema::dropIfExists('locations');
        Schema::dropIfExists('categories');
        Schema::dropIfExists('app_user_roles');
        Schema::dropIfExists('app_users');
        Schema::dropIfExists('roles');
    }
};
