<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Doctor extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'specialization',
        'qualifications',
        'experience_years',
        'fee_per_consultation',
        'is_online',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'fee_per_consultation' => 'decimal:2',
        'experience_years' => 'integer',
    ];

    /**
     * Relationships
     */
    /** Public URLs address a doctor by their user id, the same id the list returns. */
    public function getRouteKeyName(): string
    {
        return 'user_id';
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function consultations()
    {
        return $this->hasMany(Consultation::class, 'doctor_id', 'user_id');
    }

    /**
     * Scopes
     */
    public function scopeOnline($query)
    {
        return $query->where('is_online', true);
    }

    public function scopeOffline($query)
    {
        return $query->where('is_online', false);
    }
}
