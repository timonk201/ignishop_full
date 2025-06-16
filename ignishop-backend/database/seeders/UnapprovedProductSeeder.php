<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class UnapprovedProductSeeder extends Seeder
{
    public function run(): void
    {
        // Получаем ID продавцов
        $sellerIds = User::where('is_seller', true)
            ->pluck('id')
            ->toArray();

        if (empty($sellerIds)) {
            return; // Если нет продавцов, выходим
        }

        $unapprovedProducts = [
            // Электроника
            [
                'name' => 'Смартфон Xiaomi 13',
                'category' => 'electronics',
                'subcategory' => 'Смартфоны',
                'description' => 'Новый смартфон с камерой Leica.',
                'price' => 699.99,
                'stock' => 15,
                'image' => null,
            ],
            [
                'name' => 'Умные часы Apple Watch',
                'category' => 'electronics',
                'subcategory' => 'Умные часы',
                'description' => 'Последняя модель умных часов.',
                'price' => 399.99,
                'stock' => 20,
                'image' => null,
            ],
            // Одежда
            [
                'name' => 'Куртка зимняя',
                'category' => 'clothing',
                'subcategory' => 'Мужская одежда',
                'description' => 'Теплая зимняя куртка с мехом.',
                'price' => 199.99,
                'stock' => 25,
                'image' => null,
            ],
            [
                'name' => 'Платье вечернее',
                'category' => 'clothing',
                'subcategory' => 'Женская одежда',
                'description' => 'Элегантное вечернее платье.',
                'price' => 299.99,
                'stock' => 10,
                'image' => null,
            ],
            // Книги
            [
                'name' => 'Книга "Искусство программирования"',
                'category' => 'books',
                'subcategory' => 'Научная литература',
                'description' => 'Классический учебник по программированию.',
                'price' => 49.99,
                'stock' => 30,
                'image' => null,
            ],
            // Дом и сад
            [
                'name' => 'Набор посуды',
                'category' => 'home',
                'subcategory' => 'Кухонная утварь',
                'description' => 'Набор посуды из нержавеющей стали.',
                'price' => 149.99,
                'stock' => 15,
                'image' => null,
            ],
            // Спорт
            [
                'name' => 'Велосипед горный',
                'category' => 'sports',
                'subcategory' => 'Велосипеды',
                'description' => 'Горный велосипед с 21 скоростью.',
                'price' => 499.99,
                'stock' => 8,
                'image' => null,
            ],
            // Бытовая техника
            [
                'name' => 'Холодильник Samsung',
                'category' => 'appliances',
                'subcategory' => 'Крупная бытовая техника',
                'description' => 'Двухкамерный холодильник с No Frost.',
                'price' => 899.99,
                'stock' => 5,
                'image' => null,
            ],
            // Автотовары
            [
                'name' => 'Автомобильный компрессор',
                'category' => 'auto',
                'subcategory' => 'Инструменты для авто',
                'description' => 'Компрессор для подкачки шин.',
                'price' => 39.99,
                'stock' => 40,
                'image' => null,
            ],
            // Красота
            [
                'name' => 'Набор косметики',
                'category' => 'beauty',
                'subcategory' => 'Декоративная косметика',
                'description' => 'Набор профессиональной косметики.',
                'price' => 79.99,
                'stock' => 25,
                'image' => null,
            ],
        ];

        $i = 0;
        foreach ($unapprovedProducts as $product) {
            $category = Category::where('key', $product['category'])->first();
            $subcategory = Subcategory::where('name', $product['subcategory'])
                ->where('category_id', $category->id)
                ->first();

            Product::create([
                'name' => $product['name'],
                'category_id' => $category->id,
                'subcategory_id' => $subcategory ? $subcategory->id : null,
                'description' => $product['description'],
                'price' => $product['price'],
                'stock' => $product['stock'],
                'image' => $product['image'],
                'seller_id' => $sellerIds[$i % count($sellerIds)],
                'is_approved' => false, // Все товары не подтверждены
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ]);
            $i++;
        }
    }
}
