<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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

            // Создаём заказ
            $order = Order::create([
                'user_id' => auth()->id(),
                'items' => $validatedData['items'],
                'total' => floatval($validatedData['total']),
                'delivery_method' => $validatedData['delivery_method'],
                'address' => $validatedData['address'],
            ]);

            // Уменьшаем stock для каждого товара
            foreach ($validatedData['items'] as $item) {
                $product = Product::find($item['id']);
                $product->stock -= $item['quantity'];
                $product->save();
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
        $orders = Order::where('user_id', auth()->id())->get();

        // Обрабатываем каждый заказ, добавляя информацию о товарах
        $orders->transform(function ($order) {
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
            $order->total = (float) $order->total;
            return $order;
        });

        return response()->json(['data' => $orders], 200);
    }
}
