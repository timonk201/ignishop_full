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
                Log::info('Filtering by subcategory', ['subcategory' => $subcategoryName, 'count' => $query->count()]);
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

            // Фильтрация по цене
            if ($request->has('minPrice')) {
                $query->where('price', '>=', $request->input('minPrice'));
            }
            if ($request->has('maxPrice')) {
                $query->where('price', '<=', $request->input('maxPrice'));
            }

            // Фильтрация по наличию
            $inStockOnly = filter_var($request->input('inStockOnly', 'false'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($request->has('inStockOnly') && $inStockOnly) {
                $query->where('stock', '>', 0);
                Log::info('Applying inStockOnly filter', ['inStockOnly' => $inStockOnly]);
            } else {
                Log::info('Not applying inStockOnly filter', ['inStockOnly' => $inStockOnly]);
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

            // Пагинация
            $perPage = $request->input('per_page', 8); // По умолчанию 8 товаров на страницу
            $products = $query->paginate($perPage);

            // Максимальная цена на основе текущих фильтров
            $maxPriceQuery = Product::query();
            if ($request->has('category')) {
                $maxPriceQuery->whereHas('category', function ($q) use ($request) {
                    $q->where('key', $request->input('category'));
                });
            }
            if ($request->has('subcategory')) {
                $subcategoryName = $request->input('subcategory');
                $maxPriceQuery->whereHas('subcategory', function ($q) use ($subcategoryName) {
                    $q->where('name', $subcategoryName);
                });
            }
            if ($request->has('search')) {
                $searchTerm = $request->input('search');
                $maxPriceQuery->where(function ($q) use ($searchTerm) {
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
            $maxPrice = $maxPriceQuery->max('price') ?: 1000;

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
                'inStockOnly' => $inStockOnly,
                'subcategory' => $request->input('subcategory'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $products->items(), // Текущие товары
                'total' => $products->total(), // Общее количество товаров
                'per_page' => $products->perPage(),
                'current_page' => $products->currentPage(),
                'last_page' => $products->lastPage(),
                'max_price' => $maxPrice, // Максимальная цена с учётом фильтров
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
