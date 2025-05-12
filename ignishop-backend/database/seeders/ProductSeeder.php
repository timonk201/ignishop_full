<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Product;

class ProductSeeder extends Seeder
{
    public function run()
    {
        Product::create([
            'name' => 'Test Product 1',
            'description' => 'This is a test product 1',
            'price' => 99.99,
            'image' => 'test1.jpg'
        ]);
        Product::create([
            'name' => 'Test Product 2',
            'description' => 'This is a test product 2',
            'price' => 49.99,
            'image' => 'test2.jpg'
        ]);
    }
}
