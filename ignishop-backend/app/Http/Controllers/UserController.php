<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Auth;

class UserController extends Controller
{
    public function update(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        if ($request->hasFile('avatar')) {
            $avatarPath = $request->file('avatar')->store('avatars', 'public');
            $user->avatar = $avatarPath;
        }

        $user->update([
            'name' => $request->name,
            'email' => $request->email
        ]);

        // Convert avatar path to full URL if it exists
        if ($user->avatar) {
            $user->avatar = asset('storage/' . ltrim($user->avatar, '/'));
        }

        return response()->json($user);
    }

    public function becomeSeller()
    {
        $user = Auth::user();

        if ($user->is_seller) {
            return response()->json(['message' => 'User is already a seller'], 400);
        }

        $user->becomeSeller();
        return response()->json(['message' => 'Successfully became a seller', 'user' => $user]);
    }

    public function getSellerStatus()
    {
        $user = Auth::user();
        return response()->json([
            'is_seller' => $user->is_seller,
            'products_count' => $user->products()->count()
        ]);
    }
}
