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
});

// Маршруты для админки
Route::post('/admin/login', [AdminController::class, 'login']);

// Маршруты для категорий и подкатегорий
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/subcategories', [SubcategoryController::class, 'index']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/user/update', [UserController::class, 'update']);
});

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
