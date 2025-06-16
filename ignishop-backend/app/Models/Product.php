<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'stock',
        'image',
        'category_id',
        'subcategory_id',
        'seller_id',
        'is_approved'
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_approved' => 'boolean'
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function subcategory(): BelongsTo
    {
        return $this->belongsTo(Subcategory::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'favorites', 'product_id', 'user_id')
                    ->withTimestamps();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function seller()
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function approve()
    {
        $this->update(['is_approved' => true]);
    }

    public function reject()
    {
        $this->update(['is_approved' => false]);
    }
}
