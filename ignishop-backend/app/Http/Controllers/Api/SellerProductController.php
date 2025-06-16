<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SellerProductController extends Controller
{
    public function index()
    {
        $products = Auth::user()->products()->with(['category', 'subcategory'])->get();
        return response()->json($products);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'image' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $imagePath = $request->file('image')->store('products', 'public');

        $product = Auth::user()->products()->create([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'category_id' => $request->category_id,
            'subcategory_id' => $request->subcategory_id,
            'image' => $imagePath,
            'is_approved' => false
        ]);

        return response()->json($product, 201);
    }

    public function update(Request $request, Product $product)
    {
        if ($product->seller_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($request->hasFile('image')) {
            $imagePath = $request->file('image')->store('products', 'public');
            $product->image = $imagePath;
        }

        $product->update([
            'name' => $request->name,
            'description' => $request->description,
            'price' => $request->price,
            'stock' => $request->stock,
            'category_id' => $request->category_id,
            'subcategory_id' => $request->subcategory_id,
            'is_approved' => false // Сбрасываем статус подтверждения при обновлении
        ]);

        return response()->json($product);
    }

    public function destroy(Product $product)
    {
        if ($product->seller_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->delete();
        return response()->json(null, 204);
    }

    public function show($id)
    {
        $product = Product::find($id);
        if (!$product || $product->seller_id !== Auth::id()) {
            return response()->json(['message' => 'Товар не найден'], 404);
        }
        // Добавляем абсолютный путь к картинке, если нужно
        if ($product->image && !str_starts_with($product->image, 'http')) {
            $product->image = asset('storage/' . ltrim($product->image, '/'));
        }
        return response()->json($product);
    }
}
