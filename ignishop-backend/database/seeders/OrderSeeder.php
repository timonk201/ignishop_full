<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Seeder;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class OrderSeeder extends Seeder
{
    public function run()
    {
        $users = User::all();
        // Получаем только подтвержденные товары
        $products = Product::where('is_approved', true)->get();

        foreach ($users as $user) {
            // Генерация от 1 до 3 заказов на пользователя
            $orderCount = rand(1, 3);
            for ($i = 0; $i < $orderCount; $i++) {
                $orderItems = [];
                $total = 0;
                $itemCount = rand(1, 3); // От 1 до 3 товаров в заказе

                // Выбор случайных товаров с учетом остатка на складе
                $availableProducts = $products->where('stock', '>', 0)->random(min($itemCount, $products->where('stock', '>', 0)->count()));
                foreach ($availableProducts as $product) {
                    $quantity = rand(1, min(5, $product->stock)); // Количество до 5 или остатка на складе
                    $orderItems[] = [
                        'id' => $product->id,
                        'name' => $product->name,
                        'price' => $product->price,
                        'quantity' => $quantity,
                        'seller_id' => $product->seller_id,
                    ];
                    $total += $product->price * $quantity;
                }

                // Определяем delivery_method и address
                $deliveryMethod = ['pickup', 'delivery'][rand(0, 1)];
                if ($deliveryMethod === 'pickup') {
                    $address = null;
                } else {
                    $countries = ['Россия', 'Беларусь', 'Казахстан', 'Украина', 'Армения', 'Грузия', 'Азербайджан', 'Узбекистан', 'Киргизия', 'Таджикистан', 'Молдова', 'Латвия', 'Литва', 'Эстония'];
                    $country = $countries[array_rand($countries)];
                    $cities = [
                        'Россия' => ['Москва', 'Санкт-Петербург', 'Новосибирск', 'Екатеринбург', 'Казань'],
                        'Беларусь' => ['Минск', 'Гомель', 'Могилёв', 'Витебск', 'Гродно'],
                        'Казахстан' => ['Алматы', 'Нур-Султан', 'Шымкент', 'Караганда', 'Актобе'],
                        'Украина' => ['Киев', 'Харьков', 'Одесса', 'Днепр', 'Львов'],
                        'Армения' => ['Ереван', 'Гюмри', 'Ванадзор'],
                        'Грузия' => ['Тбилиси', 'Батуми', 'Кутаиси'],
                        'Азербайджан' => ['Баку', 'Гянджа', 'Сумгаит'],
                        'Узбекистан' => ['Ташкент', 'Самарканд', 'Бухара'],
                        'Киргизия' => ['Бишкек', 'Ош', 'Джалал-Абад'],
                        'Таджикистан' => ['Душанбе', 'Худжанд', 'Бохтар'],
                        'Молдова' => ['Кишинёв', 'Бельцы', 'Тирасполь'],
                        'Латвия' => ['Рига', 'Даугавпилс', 'Лиепая'],
                        'Литва' => ['Вильнюс', 'Каунас', 'Клайпеда'],
                        'Эстония' => ['Таллин', 'Тарту', 'Нарва'],
                    ];
                    $city = $cities[$country][array_rand($cities[$country])];
                    $streets = ['Ленина', 'Советская', 'Пушкина', 'Мира', 'Гагарина', 'Кирова', 'Жукова', 'Садовая', 'Школьная', 'Центральная'];
                    $street = $streets[array_rand($streets)];
                    $house = rand(1, 200);
                    $apartment = rand(0, 1) ? (string)rand(1, 150) : '';
                    $postalCode = str_pad((string)rand(100000, 999999), 6, '0', STR_PAD_LEFT);
                    $address = $country . ', ' . $city . ', ' . $street . ', д. ' . $house . ($apartment ? ', кв. ' . $apartment : '') . ', ' . $postalCode;
                }

                // Определяем статус заказа
                $status = ['pending', 'processing', 'completed', 'cancelled'][rand(0, 3)];

                // Создание заказа в транзакции
                DB::beginTransaction();
                try {
                    $order = Order::create([
                        'user_id' => $user->id,
                        'items' => $orderItems,
                        'total' => $total,
                        'delivery_method' => $deliveryMethod,
                        'address' => $address,
                        'status' => $status,
                        'created_at' => Carbon::now()->subDays(rand(0, 30)),
                        'updated_at' => Carbon::now(),
                    ]);

                    // Уменьшаем stock для каждого товара
                    foreach ($orderItems as $item) {
                        $product = Product::find($item['id']);
                        $product->decrement('stock', $item['quantity']);
                    }

                    DB::commit();
                } catch (\Exception $e) {
                    DB::rollBack();
                    throw $e;
                }
            }
        }
    }
}
