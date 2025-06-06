<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FavoriteController extends Controller
{
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['message' => 'Не аутентифицирован'], 401);
            }

            $favorites = $user->favorites()->with(['category', 'subcategory'])->get();

            Log::info('Favorites fetched successfully for user', [
                'user_id' => $user->id,
                'count' => $favorites->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $favorites,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching favorites', [
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
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        try {
            $product = Product::findOrFail($validated['product_id']);
            $user->favorites()->syncWithoutDetaching([$product->id]);

            Log::info('Product added to favorites', [
                'user_id' => $user->id,
                'product_id' => $product->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Товар добавлен в избранное',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error adding product to favorites', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при добавлении в избранное',
            ], 500);
        }
    }

    public function destroy(Request $request, $productId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        try {
            $user->favorites()->detach($productId);

            Log::info('Product removed from favorites', [
                'user_id' => $user->id,
                'product_id' => $productId,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Товар удалён из избранного',
            ]);
        } catch (\Exception $e) {
            Log::error('Error removing product from favorites', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении из избранного',
            ], 500);
        }
    }
}
