<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use App\Models\UserTask;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Arr;

class OrderController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'items' => 'required|array',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'total' => 'required|numeric',
            'delivery_method' => 'required|string',
            'address' => 'nullable|string',
            'used_bonus_points' => 'nullable|integer|min:0',
        ]);

        try {
            // Начало транзакции
            DB::beginTransaction();

            // Проверяем наличие товара на складе
            foreach ($validatedData['items'] as $item) {
                $product = Product::find($item['id']);
                if (!$product) {
                    throw new \Exception("Товар с ID {$item['id']} не найден.");
                }
                if ($product->stock < $item['quantity']) {
                    throw new \Exception("Недостаточно товара '{$product->name}' на складе. Доступно: {$product->stock}, заказано: {$item['quantity']}.");
                }
            }

            $user = auth()->user();
            // Списание бонусов
            $usedBonus = Arr::get($validatedData, 'used_bonus_points', 0);
            $maxBonus = min((int)($validatedData['total'] * 0.9), $user->bonus_points);
            if ($usedBonus > $maxBonus) {
                throw new \Exception('Слишком много бонусов для списания.');
            }
            $user->bonus_points -= $usedBonus;
            $user->save();

            // Создаём заказ
            $order = Order::create([
                'user_id' => auth()->id(),
                'items' => $validatedData['items'],
                'total' => floatval($validatedData['total']),
                'delivery_method' => $validatedData['delivery_method'],
                'address' => $validatedData['address'],
                'used_bonus_points' => $usedBonus,
            ]);

            // Уменьшаем stock для каждого товара
            foreach ($validatedData['items'] as $item) {
                $product = Product::find($item['id']);
                $product->stock -= $item['quantity'];
                $product->save();
            }

            // Проверяем задания пользователя и начисляем бонусы
            foreach ($validatedData['items'] as $item) {
                $task = UserTask::where('user_id', $user->id)
                    ->where('product_id', $item['id'])
                    ->where('completed', false)
                    ->first();
                if ($task && $item['quantity'] >= $task->quantity) {
                    $user->bonus_points += $task->reward;
                    $user->save();
                    $task->completed = true;
                    $task->save();
                }
            }

            // Подтверждаем транзакцию
            DB::commit();

            Log::info('Order created successfully', ['order_id' => $order->id, 'items' => $validatedData['items']]);

            return response()->json(['message' => 'Заказ успешно создан', 'order' => $order], 201);
        } catch (\Exception $e) {
            // Откатываем транзакцию в случае ошибки
            DB::rollBack();

            Log::error('Error creating order', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function index()
    {
        $userId = auth()->id();
        $orders = Order::where('user_id', $userId)->get();

        // Получаем все product_id, на которые пользователь оставил отзывы
        $allReviewedProductIds = Review::where('user_id', $userId)->pluck('product_id')->toArray();

        // Обрабатываем каждый заказ, добавляя информацию о товарах и reviewed_items
        $orders->transform(function ($order) use ($allReviewedProductIds) {
            $order->items = collect($order->items)->map(function ($item) {
                $product = Product::find($item['id']);
                return [
                    'id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'name' => $product ? $product->name : 'Товар не найден',
                    'price' => $product ? (float) $product->price : 0,
                    'image' => $product && $product->image ? $product->image : null,
                ];
            })->toArray();

            // Определяем reviewed_items для текущего пользователя
            $order->reviewed_items = $allReviewedProductIds;

            $order->total = (float) $order->total;
            $order->used_bonus_points = (int) ($order->used_bonus_points ?? 0);
            return $order;
        });

        return response()->json(['data' => $orders], 200);
    }
}
