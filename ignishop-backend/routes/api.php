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

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Ресурсы
Route::apiResource('products', ProductController::class);
Route::apiResource('cart', CartController::class)->except(['update', 'show']);

// Кастомные маршруты для корзины
Route::delete('/cart/clear', [CartController::class, 'clear']);
Route::put('/cart/{id}', [CartController::class, 'update']); // Добавляем маршрут для PUT

// Маршруты для заказов
Route::post('/orders', [OrderController::class, 'store']);
Route::get('/orders', [OrderController::class, 'index']);

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
    Route::get('/favorites', [App\Http\Controllers\Api\FavoriteController::class, 'index']);
    Route::post('/favorites', [App\Http\Controllers\Api\FavoriteController::class, 'store']);
    Route::delete('/favorites/{productId}', [App\Http\Controllers\Api\FavoriteController::class, 'destroy']);
});
