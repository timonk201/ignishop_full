<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AdminProductController extends Controller
{
    public function index()
    {
        $products = Product::with(['seller', 'category', 'subcategory'])
            ->where('is_approved', false)
            ->get();
        return response()->json($products);
    }

    public function approve(Product $product)
    {
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->approve();
        return response()->json($product);
    }

    public function reject(Product $product)
    {
        if (!Auth::user()->is_admin) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $product->reject();
        return response()->json($product);
    }
}
