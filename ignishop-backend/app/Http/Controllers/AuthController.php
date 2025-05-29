<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        \Log::info('Register request data:', $request->all());

        $validatedData = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'is_admin' => 'boolean',
        ]);

        $user = User::create([
            'name' => $validatedData['name'],
            'email' => $validatedData['email'],
            'password' => Hash::make($validatedData['password']),
            'is_admin' => $validatedData['is_admin'] ?? false,
        ]);

        return response()->json(['message' => 'Пользователь успешно зарегистрирован', 'user' => $user], 201);
    }

    public function login(Request $request)
    {
        $validatedData = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $validatedData['email'])->first();

        if (!$user || !Hash::check($validatedData['password'], $user->password)) {
            return response()->json(['message' => 'Неверные учетные данные'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            \Log::error('User not authenticated for /api/user request');
            return response()->json(['message' => 'Не аутентифицирован'], 401);
        }

        // Добавляем полный URL для аватара
        if ($user->avatar) {
            $user->avatar = asset('storage/' . $user->avatar);
        }

        return response()->json($user);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Успешный выход']);
    }
}
