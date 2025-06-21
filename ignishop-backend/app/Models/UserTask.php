<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UserTask extends Model
{
    protected $fillable = [
        'user_id', 'product_id', 'quantity', 'reward', 'completed'
    ];

    protected $casts = [
        'completed' => 'boolean',
        'reward' => 'integer',
        'quantity' => 'integer',
        'user_id' => 'integer',
        'product_id' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
