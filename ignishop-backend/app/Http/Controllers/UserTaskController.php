<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\UserTask;
use App\Models\Product;
use Illuminate\Support\Facades\DB;

class UserTaskController extends Controller
{
    // Получить задания пользователя
    public function index(Request $request)
    {
        $tasks = UserTask::with('product')
            ->where('user_id', $request->user()->id)
            ->get();
        return response()->json($tasks);
    }

    // Сгенерировать задания на месяц
    public function generate(Request $request)
    {
        $user = $request->user();
        // Не генерировать, если уже есть задания за этот месяц
        $exists = UserTask::where('user_id', $user->id)
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->exists();
        if ($exists) {
            return response()->json(['message' => 'Задания уже сгенерированы'], 400);
        }
        $products = Product::where('is_approved', true)->inRandomOrder()->limit(20)->get();
        $maxTasks = 5;
        $maxQty = 5;
        $minQty = 1;
        $maxTotal = 1000;
        $tasks = [];
        foreach ($products->take($maxTasks) as $product) {
            $maxQtyForProduct = min($maxQty, max($minQty, floor($maxTotal / $product->price)));
            $maxQtyForProduct = max($minQty, min($maxQtyForProduct, $maxQty));
            $quantity = rand($minQty, $maxQtyForProduct);
            $reward = round($product->price * $quantity * 0.2);
            $tasks[] = [
                'user_id' => $user->id,
                'product_id' => $product->id,
                'quantity' => $quantity,
                'reward' => $reward,
                'completed' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('user_tasks')->insert($tasks);
        return response()->json(['success' => true]);
    }

    // Отметить задание выполненным (используется при оформлении заказа)
    public function markCompleted($userId, $productId)
    {
        $task = UserTask::where('user_id', $userId)
            ->where('product_id', $productId)
            ->where('completed', false)
            ->first();
        if ($task) {
            $task->completed = true;
            $task->save();
        }
    }
}
