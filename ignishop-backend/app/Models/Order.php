<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'items',
        'total',
        'delivery_method',
        'address',
        'status',
        'used_bonus_points',
    ];

    protected $casts = [
        'items' => 'array',
        'reviewed_items' => 'array',
        'used_bonus_points' => 'integer',
    ];

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
