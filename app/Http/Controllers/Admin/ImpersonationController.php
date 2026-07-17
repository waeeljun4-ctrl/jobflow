<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ImpersonationController extends Controller
{
    /**
     * Admin logs in as a worker to see exactly what that worker sees.
     * The admin's own id is stashed in the session (never in the auth
     * guard) so `stop()` can restore it — this is a real session login as
     * the target user, not a read-only simulation.
     */
    public function start(Request $request, User $user)
    {
        abort_if($user->isAdmin(), 403, 'لا يمكن معاينة شاشة حساب مدير آخر.');
        abort_if($request->session()->has('impersonator_id'), 403, 'أنت بالفعل تعاين حساب عامل آخر.');

        $request->session()->put('impersonator_id', $request->user()->id);
        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/')->with('success', "أنت الآن تشاهد التطبيق كما يظهر لـ {$user->name}.");
    }

    public function stop(Request $request)
    {
        $adminId = $request->session()->pull('impersonator_id');

        abort_unless($adminId, 403);

        Auth::loginUsingId($adminId);
        $request->session()->regenerate();

        return redirect()->route('admin.users.index')->with('success', 'تم الرجوع لحسابك.');
    }
}
