<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        $validatedData = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user->id,
            'password' => 'sometimes|nullable|string|min:6',
            'avatar' => 'sometimes|nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
        ]);

        try {
            if (isset($validatedData['name'])) {
                $user->name = $validatedData['name'];
            }

            if (isset($validatedData['email'])) {
                $user->email = $validatedData['email'];
            }

            if (isset($validatedData['password'])) {
                $user->password = Hash::make($validatedData['password']);
            }

            if ($request->hasFile('avatar')) {
                // Удаляем старый аватар, если он есть
                if ($user->avatar) {
                    Storage::disk('public')->delete($user->avatar);
                }

                $path = $request->file('avatar')->store('avatars', 'public');
                $user->avatar = $path;
            }

            $user->save();

            return response()->json($user, 200);
        } catch (\Exception $e) {
            \Log::error('Error updating user: ' . $e->getMessage());
            return response()->json(['message' => 'Ошибка при обновлении профиля'], 500);
        }
    }
}
