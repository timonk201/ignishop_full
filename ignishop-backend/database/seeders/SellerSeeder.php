<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SellerSeeder extends Seeder
{
    public function run()
    {
        $sellers = [
            [
                'name' => 'Иван Иванов',
                'email' => 'ivan.ivanov@example.com',
                'password' => Hash::make('ivan123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Мария Смирнова',
                'email' => 'maria.smirnova@example.com',
                'password' => Hash::make('maria123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Петр Кузнецов',
                'email' => 'petr.kuznetsov@example.com',
                'password' => Hash::make('petr123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Елена Попова',
                'email' => 'elena.popova@example.com',
                'password' => Hash::make('elena123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Алексей Соколов',
                'email' => 'alexey.sokolov@example.com',
                'password' => Hash::make('alexey123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Ольга Морозова',
                'email' => 'olga.morozova@example.com',
                'password' => Hash::make('olga123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Дмитрий Волков',
                'email' => 'dmitry.volkov@example.com',
                'password' => Hash::make('dmitry123'),
                'is_seller' => true,
            ],
            [
                'name' => 'Анна Лебедева',
                'email' => 'anna.lebedeva@example.com',
                'password' => Hash::make('anna123'),
                'is_seller' => true,
            ],
        ];
        foreach ($sellers as $seller) {
            User::create($seller);
        }
    }
}
