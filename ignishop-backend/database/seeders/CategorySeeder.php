<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'electronics' => [
                'name' => 'Электроника',
                'subcategories' => ['Смартфоны', 'Ноутбуки', 'Планшеты', 'Аудиотехника', 'Умные часы', 'Камеры и фотоаппараты', 'Игровые консоли', 'Аксессуары для электроники'],
            ],
            'clothing' => [
                'name' => 'Одежда',
                'subcategories' => ['Мужская одежда', 'Женская одежда', 'Детская одежда', 'Спортивная одежда', 'Нижнее белье', 'Платья', 'Костюмы и пиджаки'],
            ],
            'books' => [
                'name' => 'Книги',
                'subcategories' => ['Художественная литература', 'Научная литература', 'Детские книги', 'Учебники', 'Комиксы', 'Аудиокниги'],
            ],
            'home' => [
                'name' => 'Дом и сад',
                'subcategories' => ['Мебель', 'Декор', 'Садовые инструменты', 'Освещение', 'Кухонная утварь', 'Текстиль для дома', 'Садовая мебель'],
            ],
            'sports' => [
                'name' => 'Спорт и развлечения',
                'subcategories' => ['Тренажеры', 'Спортивная одежда', 'Аксессуары', 'Велосипеды', 'Кемпинг и походы', 'Рыбалка', 'Фитнес-оборудование'],
            ],
            'beauty' => [
                'name' => 'Красота и здоровье',
                'subcategories' => ['Косметика', 'Средства по уходу за кожей', 'Парфюмерия', 'Инструменты для макияжа', 'Средства для волос', 'Средства для похудения'],
            ],
            'jewelry' => [
                'name' => 'Украшения и аксессуары',
                'subcategories' => ['Серьги', 'Кольца', 'Ожерелья', 'Браслеты', 'Часы', 'Аксессуары для волос'],
            ],
            'shoes' => [
                'name' => 'Обувь',
                'subcategories' => ['Мужская обувь', 'Женская обувь', 'Детская обувь', 'Спортивная обувь', 'Сапоги', 'Туфли'],
            ],
            'bags' => [
                'name' => 'Сумки и аксессуары',
                'subcategories' => ['Рюкзаки', 'Сумки через плечо', 'Кошельки', 'Путешествия и багаж', 'Сумки для ноутбуков'],
            ],
            'toys' => [
                'name' => 'Игрушки и хобби',
                'subcategories' => ['Конструкторы', 'Куклы', 'Игрушки для малышей', 'Настольные игры', 'Радиоуправляемые игрушки', 'Пазлы'],
            ],
            'appliances' => [
                'name' => 'Бытовая техника',
                'subcategories' => ['Кухонные приборы', 'Техника для дома', 'Климатизация', 'Мелкая бытовая техника', 'Чистящие устройства'],
            ],
            'auto' => [
                'name' => 'Автотовары',
                'subcategories' => ['Аксессуары для автомобилей', 'Автомобильная электроника', 'Шины и диски', 'Инструменты для авто', 'Запчасти'],
            ],
        ];

        foreach ($categories as $key => $data) {
            $category = Category::create([
                'key' => $key,
                'name' => $data['name'],
            ]);

            foreach ($data['subcategories'] as $subcategoryName) {
                Subcategory::create([
                    'category_id' => $category->id,
                    'name' => $subcategoryName,
                ]);
            }
        }
    }
}
