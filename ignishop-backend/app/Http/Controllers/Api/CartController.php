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

        $product = Product::findOrFail($request->product_id);
        if ($request->quantity > $product->stock) {
            return response()->json([
                'status' => 'error',
                'message' => "Нельзя добавить больше {$product->stock} единиц, так как на складе осталось только {$product->stock}.",
            ], 400);
        }

        $cartItem = Cart::where('product_id', $request->product_id)
            ->where('user_id', auth()->id() ?? null)
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
                'user_id' => auth()->id() ?? null,
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
            ->where('user_id', auth()->id() ?? null)
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
        $cartItem = Cart::where('product_id', $id)->where('user_id', auth()->id() ?? null)->firstOrFail();
        $cartItem->delete();

        return response()->json(['status' => 'success'], 200);
    }

    public function clear()
    {
        Cart::where('user_id', auth()->id() ?? null)->delete();
        return response()->json(['message' => 'Cart cleared'], 200);
    }

    public function index()
    {
        $cartItems = Cart::with('product')->where('user_id', auth()->id() ?? null)->get();
        return response()->json(['data' => $cartItems], 200);
    }
}
