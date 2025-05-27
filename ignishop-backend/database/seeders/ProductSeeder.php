<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $products = [
            // Категория: Электроника
            [
                'name' => 'Смартфон Galaxy S23',
                'category' => 'electronics',
                'subcategory' => 'Смартфоны',
                'description' => 'Современный смартфон с мощным процессором и камерой 108 МП.',
                'price' => 799.99,
                'stock' => 30,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Ноутбук ASUS ROG',
                'category' => 'electronics',
                'subcategory' => 'Ноутбуки',
                'description' => 'Игровой ноутбук с процессором i9 и видеокартой RTX 4080.',
                'price' => 1999.99,
                'stock' => 15,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Умные часы Xiaomi',
                'category' => 'electronics',
                'subcategory' => 'Умные часы',
                'description' => 'Смарт-часы с функцией отслеживания активности.',
                'price' => 99.99,
                'stock' => 50,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Одежда
            [
                'name' => 'Футболка Nike',
                'category' => 'clothing',
                'subcategory' => 'Мужская одежда',
                'description' => 'Хлопковая футболка для повседневной носки.',
                'price' => 29.99,
                'stock' => 100,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Платье Zara',
                'category' => 'clothing',
                'subcategory' => 'Женская одежда',
                'description' => 'Элегантное платье для вечернего выхода.',
                'price' => 59.99,
                'stock' => 50,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Нижнее белье Calvin Klein',
                'category' => 'clothing',
                'subcategory' => 'Нижнее белье',
                'description' => 'Комплект нижнего белья для женщин.',
                'price' => 39.99,
                'stock' => 70,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Книги
            [
                'name' => 'Роман "1984"',
                'category' => 'books',
                'subcategory' => 'Художественная литература',
                'description' => 'Классический роман-антиутопия Джорджа Оруэлла.',
                'price' => 14.99,
                'stock' => 50,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Комикс "Человек-паук"',
                'category' => 'books',
                'subcategory' => 'Комиксы',
                'description' => 'Комикс о приключениях Человека-паука.',
                'price' => 9.99,
                'stock' => 60,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Дом и сад
            [
                'name' => 'Диван угловой',
                'category' => 'home',
                'subcategory' => 'Мебель',
                'description' => 'Угловой диван с мягкой обивкой.',
                'price' => 799.99,
                'stock' => 10,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Кухонный нож',
                'category' => 'home',
                'subcategory' => 'Кухонная утварь',
                'description' => 'Острый нож для нарезки продуктов.',
                'price' => 19.99,
                'stock' => 40,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Спорт и развлечения
            [
                'name' => 'Беговая дорожка',
                'category' => 'sports',
                'subcategory' => 'Тренажеры',
                'description' => 'Электрическая беговая дорожка с регулировкой скорости.',
                'price' => 599.99,
                'stock' => 10,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Палатка для кемпинга',
                'category' => 'sports',
                'subcategory' => 'Кемпинг и походы',
                'description' => 'Палатка на 4 человека для походов.',
                'price' => 129.99,
                'stock' => 20,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Красота и здоровье
            [
                'name' => 'Тушь для ресниц Maybelline',
                'category' => 'beauty',
                'subcategory' => 'Косметика',
                'description' => 'Тушь для объема и удлинения ресниц.',
                'price' => 12.99,
                'stock' => 80,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Крем для лица Nivea',
                'category' => 'beauty',
                'subcategory' => 'Средства по уходу за кожей',
                'description' => 'Увлажняющий крем для лица.',
                'price' => 15.99,
                'stock' => 60,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Украшения и аксессуары
            [
                'name' => 'Серебряное ожерелье',
                'category' => 'jewelry',
                'subcategory' => 'Ожерелья',
                'description' => 'Ожерелье из серебра с подвеской.',
                'price' => 49.99,
                'stock' => 30,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Часы Casio',
                'category' => 'jewelry',
                'subcategory' => 'Часы',
                'description' => 'Классические наручные часы.',
                'price' => 79.99,
                'stock' => 25,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Обувь
            [
                'name' => 'Кроссовки Adidas',
                'category' => 'shoes',
                'subcategory' => 'Спортивная обувь',
                'description' => 'Удобные кроссовки для бега.',
                'price' => 89.99,
                'stock' => 40,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Женские туфли',
                'category' => 'shoes',
                'subcategory' => 'Туфли',
                'description' => 'Элегантные туфли на каблуке.',
                'price' => 69.99,
                'stock' => 30,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Сумки и аксессуары
            [
                'name' => 'Рюкзак Xiaomi',
                'category' => 'bags',
                'subcategory' => 'Рюкзаки',
                'description' => 'Стильный рюкзак для повседневного использования.',
                'price' => 39.99,
                'stock' => 50,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Кошелек из кожи',
                'category' => 'bags',
                'subcategory' => 'Кошельки',
                'description' => 'Кожаный кошелек с отделением для карт.',
                'price' => 29.99,
                'stock' => 60,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Игрушки и хобби
            [
                'name' => 'Конструктор LEGO',
                'category' => 'toys',
                'subcategory' => 'Конструкторы',
                'description' => 'Набор LEGO для детей от 6 лет.',
                'price' => 49.99,
                'stock' => 40,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Настольная игра "Монополия"',
                'category' => 'toys',
                'subcategory' => 'Настольные игры',
                'description' => 'Классическая игра для всей семьи.',
                'price' => 29.99,
                'stock' => 30,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Бытовая техника
            [
                'name' => 'Блендер Philips',
                'category' => 'appliances',
                'subcategory' => 'Кухонные приборы',
                'description' => 'Мощный блендер для смузи и коктейлей.',
                'price' => 59.99,
                'stock' => 20,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Пылесос Dyson',
                'category' => 'appliances',
                'subcategory' => 'Чистящие устройства',
                'description' => 'Беспроводной пылесос с высокой мощностью.',
                'price' => 299.99,
                'stock' => 15,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],

            // Категория: Автотовары
            [
                'name' => 'Автомобильный видеорегистратор',
                'category' => 'auto',
                'subcategory' => 'Автомобильная электроника',
                'description' => 'Видеорегистратор с записью в Full HD.',
                'price' => 79.99,
                'stock' => 25,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
            [
                'name' => 'Набор инструментов для авто',
                'category' => 'auto',
                'subcategory' => 'Инструменты для авто',
                'description' => 'Набор инструментов для ремонта автомобиля.',
                'price' => 49.99,
                'stock' => 30,
                'image' => null,
                'created_at' => Carbon::now(),
                'updated_at' => Carbon::now(),
            ],
        ];

        foreach ($products as $product) {
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
                'created_at' => $product['created_at'],
                'updated_at' => $product['updated_at'],
            ]);
        }
    }
}
