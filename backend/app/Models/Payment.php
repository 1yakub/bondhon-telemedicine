<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{
    use HasFactory;

    protected $fillable = [
        'consultation_id',
        'amount',
        'ssl_transaction_id',
        'ssl_session_key',
        'ssl_status',
        'ssl_val_id',
        'ssl_bank_tran_id',
        'ssl_card_type',
        'paid_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_at' => 'datetime',
    ];

    /**
     * Relationships
     */
    public function consultation()
    {
        return $this->belongsTo(Consultation::class);
    }

    /**
     * Scopes
     */
    public function scopeSuccessful($query)
    {
        return $query->whereNotNull('paid_at');
    }

    public function scopePending($query)
    {
        return $query->whereNull('paid_at');
    }
}
