<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        User::create([
            'name' => 'Timon',
            'email' => 'timon206@mail.ru',
            'password' => Hash::make('timon123'),
        ]);
    }
}
