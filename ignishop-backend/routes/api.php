<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\SubcategoryController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\FavoriteController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SellerProductController;
use App\Http\Controllers\Api\AdminProductController;
use App\Http\Controllers\UserTaskController;

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Ресурсы
Route::apiResource('products', ProductController::class);
Route::get('/products/{productId}/reviews', [ReviewController::class, 'index']);

// Аутентификация
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/user/update', [UserController::class, 'update']);
    Route::post('/user/become-seller', [UserController::class, 'becomeSeller']);
    Route::get('/user/seller-status', [UserController::class, 'getSellerStatus']);
    Route::get('/user/bonus', [UserController::class, 'getBonusPoints']);
    Route::post('/user/bonus/add', [UserController::class, 'addBonusPoints']);

    // Маршруты для продавцов
    Route::middleware('seller')->group(function () {
        Route::apiResource('seller/products', SellerProductController::class);
    });

    // Маршруты для админов
    Route::middleware('admin')->group(function () {
        Route::get('/admin/products/pending', [AdminProductController::class, 'index']);
        Route::post('/admin/products/{product}/approve', [AdminProductController::class, 'approve']);
        Route::post('/admin/products/{product}/reject', [AdminProductController::class, 'reject']);
    });

    Route::get('/user/tasks', [UserTaskController::class, 'index']);
    Route::post('/user/tasks/generate', [UserTaskController::class, 'generate']);
});

// Маршруты для категорий и подкатегорий
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/subcategories', [SubcategoryController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/favorites', [FavoriteController::class, 'index']);
    Route::post('/favorites', [FavoriteController::class, 'store']);
    Route::delete('/favorites/{productId}', [FavoriteController::class, 'destroy']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::delete('cart/clear', [CartController::class, 'clear']);
    Route::apiResource('cart', CartController::class);
    Route::apiResource('orders', OrderController::class);
    Route::post('/orders/{orderId}/products/{productId}/reviews', [ReviewController::class, 'store']);

    Route::get('/user/reviews', [ReviewController::class, 'userReviews']);
    Route::put('/reviews/{reviewId}', [ReviewController::class, 'update']);
    Route::delete('/reviews/{reviewId}', [ReviewController::class, 'destroy']);
});

Route::middleware('auth:api')->group(function () {
    Route::get('/user-tasks', [UserTaskController::class, 'index']);
    Route::post('/user-tasks/generate', [UserTaskController::class, 'generate']);
});
