<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        // Исходный пользователь
        User::create([
            'name' => 'Timon',
            'email' => 'timon206@mail.ru',
            'password' => Hash::make('timon123'),
        ]);

        // Существующие пользователи
        $users = [
            [
                'name' => 'Anna Petrova',
                'email' => 'anna.petrova@example.com',
                'password' => Hash::make('anna2023'),
            ],
            [
                'name' => 'Ivan Ivanov',
                'email' => 'ivan.ivanov@example.com',
                'password' => Hash::make('ivan456'),
            ],
            [
                'name' => 'Maria Smirnova',
                'email' => 'maria.smirnova@example.com',
                'password' => Hash::make('maria789'),
            ],
            [
                'name' => 'Alexey Kuznetsov',
                'email' => 'alexey.kuznetsov@example.com',
                'password' => Hash::make('alexey101'),
            ],
            [
                'name' => 'Olga Sidorova',
                'email' => 'olga.sidorova@example.com',
                'password' => Hash::make('olga2025'),
            ],
            [
                'name' => 'Denis Popov',
                'email' => 'denis.popov@example.com',
                'password' => Hash::make('denis303'),
            ],
            [
                'name' => 'Elena Kozlova',
                'email' => 'elena.kozlova@example.com',
                'password' => Hash::make('elena404'),
            ],
            [
                'name' => 'Sergey Petrov',
                'email' => 'sergey.petrov@example.com',
                'password' => Hash::make('sergey505'),
            ],
            [
                'name' => 'Natalia Orlova',
                'email' => 'natalia.orlova@example.com',
                'password' => Hash::make('natalia606'),
            ],
            [
                'name' => 'Pavel Morozov',
                'email' => 'pavel.morozov@example.com',
                'password' => Hash::make('pavel707'),
            ],
        ];

        // Новые пользователи
        $newUsers = [
            [
                'name' => 'Ekaterina Ivanova',
                'email' => 'ekaterina.ivanova@example.com',
                'password' => Hash::make('ekaterina808'),
            ],
            [
                'name' => 'Nikolay Semyonov',
                'email' => 'nikolay.semyonov@example.com',
                'password' => Hash::make('nikolay909'),
            ],
            [
                'name' => 'Svetlana Kuzmina',
                'email' => 'svetlana.kuzmina@example.com',
                'password' => Hash::make('svetlana010'),
            ],
            [
                'name' => 'Andrey Volkov',
                'email' => 'andrey.volkov@example.com',
                'password' => Hash::make('andrey111'),
            ],
            [
                'name' => 'Yulia Sokolova',
                'email' => 'yulia.sokolova@example.com',
                'password' => Hash::make('yulia212'),
            ],
            [
                'name' => 'Mikhail Orlov',
                'email' => 'mikhail.orlov@example.com',
                'password' => Hash::make('mikhail313'),
            ],
            [
                'name' => 'Tatiana Lebedeva',
                'email' => 'tatiana.lebedeva@example.com',
                'password' => Hash::make('tatiana414'),
            ],
            [
                'name' => 'Roman Petrov',
                'email' => 'roman.petrov@example.com',
                'password' => Hash::make('roman515'),
            ],
            [
                'name' => 'Irina Vasilieva',
                'email' => 'irina.vasilieva@example.com',
                'password' => Hash::make('irina616'),
            ],
            [
                'name' => 'Vladimir Morozov',
                'email' => 'vladimir.morozov@example.com',
                'password' => Hash::make('vladimir717'),
            ],
        ];

        // Создание всех пользователей
        foreach (array_merge($users, $newUsers) as $user) {
            User::create([
                'name' => $user['name'],
                'email' => $user['email'],
                'password' => $user['password'],
            ]);
        }
    }
}
