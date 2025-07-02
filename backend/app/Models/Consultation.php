<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'patient_id',
        'doctor_id',
        'patient_symptoms',
        'doctor_notes',
        'started_at',
        'ended_at',
        'duration_minutes',
        'fee_amount',
        'payment_status',
        'agora_channel',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'fee_amount' => 'decimal:2',
        'duration_minutes' => 'integer',
    ];

    /**
     * Relationships
     */
    public function patient()
    {
        return $this->belongsTo(User::class, 'patient_id');
    }

    public function doctor()
    {
        return $this->belongsTo(User::class, 'doctor_id');
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

    /**
     * Scopes
     */
    public function scopePending($query)
    {
        return $query->where('payment_status', 'pending');
    }

    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    public function scopeFailed($query)
    {
        return $query->where('payment_status', 'failed');
    }

    public function scopeActive($query)
    {
        return $query->whereNotNull('started_at')->whereNull('ended_at');
    }

    public function scopeCompleted($query)
    {
        return $query->whereNotNull('ended_at');
    }
}
