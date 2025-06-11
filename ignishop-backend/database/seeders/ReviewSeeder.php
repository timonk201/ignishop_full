<?php

namespace Database\Seeders;

use App\Models\Review;
use App\Models\Order;
use App\Models\User;
use App\Models\Product;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class ReviewSeeder extends Seeder
{
    public function run()
    {
        $users = User::all();
        $orders = Order::all(); // Загружаем все заказы

        foreach ($users as $user) {
            // Получаем заказы пользователя
            $userOrders = $orders->where('user_id', $user->id);

            foreach ($userOrders as $order) {
                // Извлекаем product_ids из массива items
                $purchasedProductIds = collect($order->items)->pluck('id')->toArray() ?? [];

                // Генерация от 0 до 2 отзывов на заказ
                $reviewCount = rand(0, 2);
                for ($i = 0; $i < $reviewCount; $i++) {
                    if (empty($purchasedProductIds)) {
                        continue;
                    }

                    $productId = $purchasedProductIds[array_rand($purchasedProductIds)];
                    $product = Product::find($productId);

                    if (!$product || Review::where('user_id', $user->id)->where('product_id', $productId)->exists()) {
                        continue;
                    }

                    $rating = rand(1, 5);
                    $comment = fake()->optional(0.7)->sentence(); // 70% шанс добавить комментарий
                    $image = fake()->optional(0.3)->boolean() ? $this->generateFakeImage() : null; // 30% шанс добавить изображение

                    Review::create([
                        'user_id' => $user->id,
                        'product_id' => $productId,
                        'order_id' => $order->id,
                        'rating' => $rating,
                        'comment' => $comment,
                        'image' => $image,
                        'created_at' => Carbon::now()->subDays(rand(0, 30)),
                        'updated_at' => Carbon::now(),
                    ]);
                }
            }
        }
    }

    private function generateFakeImage()
    {
        $imageName = 'review_' . uniqid() . '.jpg';
        $imagePath = 'reviews/' . $imageName;

        $width = 200;
        $height = 200;
        $image = imagecreatetruecolor($width, $height);
        $color = imagecolorallocate($image, rand(0, 255), rand(0, 255), rand(0, 255));
        imagefill($image, 0, 0, $color);

        imagejpeg($image, storage_path('app/public/' . $imagePath));
        imagedestroy($image);

        return '/storage/' . $imagePath;
    }
}
