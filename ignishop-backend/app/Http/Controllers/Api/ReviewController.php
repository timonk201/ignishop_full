<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Review;
use App\Models\Order;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class ReviewController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth:api')->only(['store', 'update', 'destroy']);
    }

    public function index($productId)
    {
        $product = Product::with('reviews.user')->findOrFail($productId);

        $reviews = $product->reviews;
        $totalReviews = $reviews->count();
        $averageRating = $totalReviews > 0 ? $reviews->avg('rating') : null;
        $ratingDistribution = [
            5 => $reviews->where('rating', 5)->count(),
            4 => $reviews->where('rating', 4)->count(),
            3 => $reviews->where('rating', 3)->count(),
            2 => $reviews->where('rating', 2)->count(),
            1 => $reviews->where('rating', 1)->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => [
                'reviews' => $reviews,
                'total_reviews' => $totalReviews,
                'average_rating' => $averageRating,
                'rating_distribution' => $ratingDistribution,
            ],
        ]);
    }

    public function userReviews(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $reviews = Review::where('user_id', $user->id)->with('product')->get();

        return response()->json([
            'success' => true,
            'data' => $reviews,
        ]);
    }

    public function store(Request $request, $orderId, $productId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $order = Order::where('user_id', $user->id)->findOrFail($orderId);
        $product = Product::findOrFail($productId);

        if (Review::where('user_id', $user->id)->where('product_id', $productId)->exists()) {
            return response()->json(['message' => 'Вы уже оставили отзыв на этот товар.'], 400);
        }

        $isPurchased = collect($order->items)->some(function ($item) use ($productId) {
            return $item['id'] == $productId && !in_array($productId, $order->reviewed_items ?? []);
        });

        if (!$isPurchased) {
            return response()->json(['message' => 'Вы не можете оставить отзыв на этот товар.'], 403);
        }

        $validated = $request->validate([
            'rating' => 'required|numeric|between:1,5',
            'comment' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048', // Добавляем валидацию для изображения
        ]);

        try {
            $data = [
                'user_id' => $user->id,
                'product_id' => $productId,
                'order_id' => $orderId,
                'rating' => $validated['rating'],
                'comment' => $validated['comment'],
            ];

            if ($request->hasFile('image')) {
                $imagePath = $request->file('image')->store('reviews', 'public');
                $data['image'] = '/storage/' . $imagePath;
            }

            $review = Review::create($data);

            $order->reviewed_items = array_merge($order->reviewed_items ?? [], [$productId]);
            $order->save();

            Log::info('Review created successfully', [
                'user_id' => $user->id,
                'product_id' => $productId,
                'order_id' => $orderId,
                'token' => $request->header('Authorization'),
            ]);

            return response()->json([
                'success' => true,
                'data' => $review,
                'message' => 'Отзыв успешно добавлен',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error creating review', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'token' => $request->header('Authorization'),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при создании отзыва',
            ], 500);
        }
    }

    public function update(Request $request, $reviewId)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $review = Review::where('id', $reviewId)->where('user_id', $user->id)->first();
        if (!$review) {
            return response()->json(['message' => 'Отзыв не найден или вам не разрешено его редактировать'], 404);
        }

        // Детализированный отладочный вывод
        Log::info('Received review update request', [
            'review_id' => $reviewId,
            'user_id' => $user->id,
            'request_all' => $request->all(),
            'request_input' => $request->input(),
            'request_files' => $request->files->all(),
            'content_type' => $request->header('Content-Type'),
            'request_json' => $request->json()->all(), // Для JSON-данных
        ]);

        // Валидация для JSON или multipart
        $validated = $request->validate([
            'rating' => 'required|integer|between:1,5',
            'comment' => 'nullable|string|max:1000',
            'image' => 'nullable|image|max:2048', // Валидация для нового изображения
        ], [
            'rating.required' => 'Поле оценки обязательно для заполнения.',
            'rating.integer' => 'Оценка должна быть целым числом.',
            'rating.between' => 'Оценка должна быть в диапазоне от 1 до 5.',
        ]);

        try {
            $data = [
                'rating' => (int)$validated['rating'],
                'comment' => $validated['comment'],
            ];

            if ($request->hasFile('image')) {
                // Удаляем старое изображение, если оно существует
                if ($review->image) {
                    Storage::disk('public')->delete(str_replace('/storage/', '', $review->image));
                }
                $imagePath = $request->file('image')->store('reviews', 'public');
                $data['image'] = '/storage/' . $imagePath;
            }

            $review->update($data);

            // Загружаем отношение product
            $review->load('product');

            Log::info('Review updated successfully', [
                'user_id' => $user->id,
                'review_id' => $reviewId,
            ]);

            return response()->json([
                'success' => true,
                'data' => $review,
                'message' => 'Отзыв успешно обновлён',
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error updating review', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'request_data' => $request->all(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при обновлении отзыва: ' . $e->getMessage(),
            ], 422);
        }
    }

    public function destroy($reviewId)
    {
        $user = request()->user();
        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $review = Review::where('id', $reviewId)->where('user_id', $user->id)->first();
        if (!$review) {
            return response()->json(['message' => 'Отзыв не найден или вам не разрешено его удалять'], 404);
        }

        try {
            // Удаляем изображение, если оно существует
            if ($review->image) {
                Storage::disk('public')->delete(str_replace('/storage/', '', $review->image));
            }
            $review->delete();
            Log::info('Review deleted successfully', [
                'user_id' => $user->id,
                'review_id' => $reviewId,
            ]);
            return response()->json([
                'success' => true,
                'message' => 'Отзыв успешно удалён',
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error deleting review', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Ошибка при удалении отзыва: ' . $e->getMessage(),
            ], 500);
        }
    }
}
