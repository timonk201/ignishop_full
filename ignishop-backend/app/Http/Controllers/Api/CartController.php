<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
        ]);

        $cartItem = Cart::firstOrCreate(
            [
                'user_id' => auth()->id() ?? null, // Если авторизация не настроена, можно использовать null
                'product_id' => $request->product_id,
            ],
            ['quantity' => $request->quantity]
        );

        if ($cartItem->wasRecentlyCreated) {
            $cartItem->quantity = $request->quantity;
        } else {
            $cartItem->increment('quantity', $request->quantity);
        }

        $cartItem->save();

        return response()->json([
            'status' => 'success',
            'data' => $cartItem->load('product'),
        ], 201);
    }

    public function destroy($id)
    {
        $cartItem = Cart::where('product_id', $id)->where('user_id', auth()->id() ?? null)->firstOrFail();
        $cartItem->delete();

        return response()->json(['status' => 'success'], 200);
    }

    public function clear()
{
    auth()->user()->cart()->delete();
    return response()->json(['message' => 'Cart cleared'], 200);
}

    public function index()
    {
        $cartItems = Cart::with('product')->where('user_id', auth()->id() ?? null)->get();
        return response()->json(['data' => $cartItems], 200);
    }
}
