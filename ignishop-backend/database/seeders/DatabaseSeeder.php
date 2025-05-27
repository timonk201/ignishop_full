<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call(AdminSeeder::class);
        $this->call(UserSeeder::class);
        $this->call(CategorySeeder::class);
        $this->call(ProductSeeder::class);
    }
}
