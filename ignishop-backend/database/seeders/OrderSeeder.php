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
        $products = Product::all();

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
                        'quantity' => $quantity,
                    ];
                    $total += $product->price * $quantity;
                }

                // Определяем delivery_method и address
                $deliveryMethod = ['pickup', 'delivery'][rand(0, 1)];
                $address = $deliveryMethod === 'pickup' ? null : fake()->address();

                // Создание заказа в транзакции
                DB::beginTransaction();
                try {
                    $order = Order::create([
                        'user_id' => $user->id,
                        'items' => $orderItems,
                        'total' => $total,
                        'delivery_method' => $deliveryMethod,
                        'address' => $address,
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
