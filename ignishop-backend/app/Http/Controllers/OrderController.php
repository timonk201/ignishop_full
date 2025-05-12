<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'items' => 'required|array',
            'total' => 'required|numeric',
            'delivery_method' => 'required|string',
            'address' => 'nullable|string',
        ]);

        $order = Order::create([
            'user_id' => auth()->id(), // Опционально, если есть авторизация
            'items' => $validatedData['items'],
            'total' => floatval($validatedData['total']), // Преобразуем в число
            'delivery_method' => $validatedData['delivery_method'],
            'address' => $validatedData['address'],
        ]);

        return response()->json(['message' => 'Заказ успешно создан', 'order' => $order], 201);
    }

    public function index()
    {
        $orders = Order::all();
        return response()->json(['data' => $orders]);
    }
}
