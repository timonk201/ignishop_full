<?php

namespace App\Http\Controllers\Api;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use App\Http\Controllers\Controller;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = Product::query()->with(['category', 'subcategory']);

            if ($request->has('category')) {
                $category = $request->input('category');
                $query->whereHas('category', function ($q) use ($category) {
                    $q->where('key', $category);
                });
            }

            if ($request->has('subcategory')) {
                $subcategoryName = $request->input('subcategory');
                $query->whereHas('subcategory', function ($q) use ($subcategoryName) {
                    $q->where('name', $subcategoryName);
                });
            }

            $products = $query->get();

            Log::info('Products fetched successfully', ['count' => $products->count()]);

            return response()->json([
                'success' => true,
                'data' => $products,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching products', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Internal server error',
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('images', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'subcategory']),
        ], 201);
    }

    public function show($id)
    {
        $product = Product::with(['category', 'subcategory'])->findOrFail($id);
        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function update(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category_id' => 'required|exists:categories,id',
            'subcategory_id' => 'nullable|exists:subcategories,id',
            'description' => 'required|string',
            'price' => 'required|numeric|min:0',
            'stock' => 'required|integer|min:0',
            'image' => 'nullable|image|mimes:jpeg,png,gif,webp|max:2048',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $product->image));
            }
            $path = $request->file('image')->store('images', 'public');
            $validated['image'] = '/storage/' . $path;
        }

        $product->update($validated);

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'subcategory']),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::findOrFail($id);
        if ($product->image) {
            Storage::disk('public')->delete(str_replace('/storage/', '', $product->image));
        }
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Product deleted successfully',
        ]);
    }
}
