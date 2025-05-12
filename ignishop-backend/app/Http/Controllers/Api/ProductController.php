<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Product;


class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = $request->input('search');
        $products = Product::query();

        if ($query) {
            $products->where(function ($queryBuilder) use ($query) {
                $queryBuilder->where('name', 'like', "%{$query}%")
                             ->orWhere('category', 'like', "%{$query}%")
                             ->orWhere('description', 'like', "%{$query}%");
            });
        }

        $products = $products->get();
        return response()->json(['data' => $products]);
    }



    public function store(Request $request)
{
    \Log::info('Received store data:', $request->all());
    $validatedData = $request->validate([
        'name' => 'required|string|max:255',
        'category' => 'required|string',
        'description' => 'nullable|string',
        'price' => 'required|numeric',
        'stock' => 'required|integer',
        'image' => 'nullable|image|mimes:jpeg|max:2048',
    ]);

    if ($request->hasFile('image')) {
        $imageName = time() . '.' . $request->file('image')->extension();
        $request->file('image')->move(public_path('images'), $imageName);
        $validatedData['image'] = '/images/' . $imageName;
    } else {
        $validatedData['image'] = null; // Если изображение не загружено, ставим null
    }

    $product = Product::create($validatedData);
    return response()->json([
        'status' => 'success',
        'data' => $product
    ], 201);
}

public function update(Request $request, Product $product)
{
    \Log::info('Received update data:', $request->all());
    $validatedData = $request->validate([
        'name' => 'required|string|max:255',
        'category' => 'required|string',
        'description' => 'nullable|string',
        'price' => 'required|numeric',
        'stock' => 'required|integer',
        'image' => 'nullable|image|mimes:jpeg|max:2048',
    ]);

    if ($request->hasFile('image')) {
        $imageName = time() . '.' . $request->file('image')->extension();
        $request->file('image')->move(public_path('images'), $imageName);
        $validatedData['image'] = '/images/' . $imageName;
    } else {
        $validatedData['image'] = $product->image; // Сохраняем старое изображение
    }

    $product->update($validatedData);
    return response()->json([
        'status' => 'success',
        'data' => $product
    ], 200);
}

public function show($id)
    {
        $product = Product::findOrFail($id);
        return response()->json(['data' => $product]);
    }

    public function destroy(Product $product)
    {
        $product->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Product deleted'
        ], 200);
    }
}
