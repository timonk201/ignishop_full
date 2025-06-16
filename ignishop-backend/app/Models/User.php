<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable
{
    use Notifiable, HasApiTokens;

    protected $fillable = [
        'name', 'email', 'password', 'is_admin', 'is_seller', 'avatar', 'role'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'is_admin' => 'boolean',
        'is_seller' => 'boolean',
    ];

    public function favorites(): BelongsToMany
    {
        return $this->belongsToMany(Product::class, 'favorites', 'user_id', 'product_id')
                    ->withTimestamps();
    }

    public function products()
    {
        return $this->hasMany(Product::class, 'seller_id');
    }

    public function isSeller()
    {
        return $this->is_seller;
    }

    public function becomeSeller()
    {
        $this->update(['is_seller' => true]);
    }
}
