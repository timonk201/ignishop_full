<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:users,email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password) || !$user->is_admin) {
            return response()->json(['message' => 'Неверные учетные данные или не администратор'], 401);
        }

        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json(['token' => $token], 200);
    }
}
