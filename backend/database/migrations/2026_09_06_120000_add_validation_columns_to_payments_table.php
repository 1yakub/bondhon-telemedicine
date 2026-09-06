<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->string('ssl_session_key')->nullable()->after('ssl_transaction_id');
            $table->string('ssl_val_id')->nullable()->after('ssl_status');
            $table->string('ssl_bank_tran_id')->nullable()->after('ssl_val_id');
            $table->string('ssl_card_type')->nullable()->after('ssl_bank_tran_id');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table) {
            $table->dropColumn(['ssl_session_key', 'ssl_val_id', 'ssl_bank_tran_id', 'ssl_card_type']);
        });
    }
};
