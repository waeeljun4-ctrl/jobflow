<?php

namespace App\Http\Controllers;

use App\Services\LoginIdentifierService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        return Inertia::render('Auth/Login');
    }

    public function login(Request $request, LoginIdentifierService $identifiers)
    {
        $data = $request->validate([
            'login' => 'required|string',
            'password' => 'required|string',
        ]);

        $email = $identifiers->resolveEmail($data['login']);

        if (! $email || ! Auth::attempt(['email' => $email, 'password' => $data['password']], $request->boolean('remember'))) {
            return back()->withErrors([
                'login' => 'رقم الهاتف/البريد الإلكتروني أو كلمة المرور غير صحيحة',
            ]);
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
