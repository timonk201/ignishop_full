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
            $query = Product::query()->with(['category', 'subcategory', 'seller'])
                ->where('is_approved', true);

            // Фильтрация по категории
            if ($request->has('category')) {
                $category = $request->input('category');
                $query->whereHas('category', function ($q) use ($category) {
                    $q->where('key', $category);
                });
            }

            // Фильтрация по подкатегории
            if ($request->has('subcategory')) {
                $subcategoryName = $request->input('subcategory');
                $query->whereHas('subcategory', function ($q) use ($subcategoryName) {
                    $q->where('name', $subcategoryName);
                });
            }

            // Поиск по названию, категории, подкатегории и описанию
            if ($request->has('search')) {
                $searchTerm = $request->input('search');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('name', 'like', "%{$searchTerm}%")
                      ->orWhere('description', 'like', "%{$searchTerm}%")
                      ->orWhereHas('category', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', "%{$searchTerm}%");
                      })
                      ->orWhereHas('subcategory', function ($q) use ($searchTerm) {
                          $q->where('name', 'like', "%{$searchTerm}%");
                      });
                });
            }

            // Сортировка по цене
            if ($request->has('sort')) {
                $sortOrder = $request->input('sort');
                if ($sortOrder === 'asc') {
                    $query->orderBy('price', 'asc');
                } elseif ($sortOrder === 'desc') {
                    $query->orderBy('price', 'desc');
                }
            }

            // Фильтрация только с оценкой 5 звёзд (средняя оценка = 5)
            $fiveStarOnly = filter_var($request->input('fiveStarOnly', 'false'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($request->has('fiveStarOnly') && $fiveStarOnly) {
                $query->whereExists(function ($query) {
                    $query->selectRaw('1')
                          ->from('reviews')
                          ->whereColumn('reviews.product_id', 'products.id')
                          ->groupBy('reviews.product_id')
                          ->havingRaw('AVG(reviews.rating) = 5');
                });
                Log::info('Applying fiveStarOnly filter');
            }

            // Фильтрация товаров от 4 звёзд и выше
            $fourStarAndAbove = filter_var($request->input('fourStarAndAbove', 'false'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($request->has('fourStarAndAbove') && $fourStarAndAbove) {
                $query->whereExists(function ($query) {
                    $query->selectRaw('1')
                          ->from('reviews')
                          ->whereColumn('reviews.product_id', 'products.id')
                          ->groupBy('reviews.product_id')
                          ->havingRaw('AVG(reviews.rating) >= 4');
                });
                Log::info('Applying fourStarAndAbove filter');
            }

            // Пагинация
            $perPage = $request->input('per_page', 8); // По умолчанию 8 товаров на страницу
            $products = $query->paginate($perPage);

            // Добавляем среднюю оценку и общее количество отзывов
            $products->getCollection()->transform(function ($product) {
                $reviews = $product->reviews;
                $product->average_rating = $reviews->avg('rating') ?: 0;
                $product->total_reviews = $reviews->count();
                return $product;
            });

            // Добавляем информацию о том, находится ли товар в избранном
            $user = $request->user();
            $products->getCollection()->transform(function ($product) use ($user) {
                $product->is_favorited = $user ? $user->favorites()->where('product_id', $product->id)->exists() : false;
                return $product;
            });

            Log::info('Products fetched successfully', [
                'count' => $products->total(),
                'per_page' => $perPage,
                'current_page' => $products->currentPage(),
                'search' => $request->input('search'),
                'sort' => $request->input('sort'),
                'fiveStarOnly' => $fiveStarOnly,
                'fourStarAndAbove' => $fourStarAndAbove,
            ]);

            return response()->json([
                'success' => true,
                'data' => $products->items(), // Текущие товары
                'total' => $products->total(), // Общее количество товаров
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
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

    public function show(Product $product)
    {
        if (!$product->is_approved) {
            return response()->json(['message' => 'Product not found'], 404);
        }
        // Исправляем путь к картинке
        if ($product->image && !str_starts_with($product->image, 'http') && !str_starts_with($product->image, '/storage/')) {
            $product->image = '/storage/' . ltrim($product->image, '/');
        }
        return response()->json(['data' => $product->load(['category', 'subcategory', 'seller'])]);
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
