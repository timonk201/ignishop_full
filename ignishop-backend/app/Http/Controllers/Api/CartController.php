<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api');
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $product = Product::findOrFail($request->product_id);
        if ($request->quantity > $product->stock) {
            return response()->json([
                'status' => 'error',
                'message' => "Нельзя добавить больше {$product->stock} единиц, так как на складе осталось только {$product->stock}.",
            ], 400);
        }

        $cartItem = Cart::where('product_id', $request->product_id)
            ->where('user_id', auth()->id())
            ->first();

        if ($cartItem) {
            $cartItem->quantity += $request->quantity;
            if ($cartItem->quantity > $product->stock) {
                return response()->json([
                    'status' => 'error',
                    'message' => "Нельзя добавить больше {$product->stock} единиц, так как на складе осталось только {$product->stock}.",
                ], 400);
            }
            $cartItem->save();
        } else {
            $cartItem = Cart::create([
                'user_id' => auth()->id(),
                'product_id' => $request->product_id,
                'quantity' => $request->quantity,
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $cartItem->load('product'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = Cart::where('product_id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $product = Product::findOrFail($id);
        if ($request->quantity > $product->stock) {
            return response()->json([
                'status' => 'error',
                'message' => "Нельзя добавить больше {$product->stock} единиц, так как на складе осталось только {$product->stock}.",
            ], 400);
        }

        $cartItem->quantity = $request->quantity;
        $cartItem->save();

        return response()->json([
            'status' => 'success',
            'data' => $cartItem->load('product'),
        ], 200);
    }

    public function destroy($id)
    {
        $cartItem = Cart::where('product_id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();
        $cartItem->delete();

        return response()->json(['status' => 'success'], 200);
    }

    public function clear()
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Очистка корзины для текущего пользователя
        Cart::where('user_id', $user->id)->delete();

        return response()->json(['message' => 'Cart cleared successfully'], 200);
    }

    public function index()
    {
        $cartItems = Cart::with('product')->where('user_id', auth()->id())->get();
        return response()->json(['data' => $cartItems], 200);
    }
}
