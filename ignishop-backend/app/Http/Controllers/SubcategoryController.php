<?php

namespace App\Http\Controllers;

use App\Models\Subcategory;
use Illuminate\Http\Request;

class SubcategoryController extends Controller
{
    public function index(Request $request)
    {
        $categoryId = $request->query('category_id');
        $subcategories = Subcategory::where('category_id', $categoryId)->get();
        return response()->json([
            'success' => true,
            'data' => $subcategories,
        ]);
    }
}
