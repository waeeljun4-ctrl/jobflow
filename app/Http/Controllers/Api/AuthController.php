<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\LoginIdentifierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request, LoginIdentifierService $identifiers)
    {
        $data = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $email = $identifiers->resolveEmail($data['login']);

        if (! $email || ! Auth::attempt(['email' => $email, 'password' => $data['password']])) {
            throw ValidationException::withMessages([
                'login' => ['رقم الهاتف/البريد الإلكتروني أو كلمة المرور غير صحيحة'],
            ]);
        }

        $user = Auth::user();
        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $this->userPayload($user),
        ]);
    }

    public function me(Request $request)
    {
        return response()->json([
            'user' => $this->userPayload($request->user()),
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['ok' => true]);
    }

    private function userPayload($user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ];
    }
}
