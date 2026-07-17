<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\OrderApiController;
use App\Http\Controllers\Api\PushSubscriptionApiController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\TaskApiController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:6,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/stages', [ReferenceController::class, 'stages']);
    Route::get('/spec-fields', [ReferenceController::class, 'specFields']);

    Route::get('/tasks', [TaskApiController::class, 'index']);
    Route::get('/tasks/{stageInstance}', [TaskApiController::class, 'show']);
    Route::post('/tasks/{stageInstance}/start', [TaskApiController::class, 'start']);
    Route::post('/tasks/{stageInstance}/complete', [TaskApiController::class, 'complete']);
    Route::post('/tasks/{stageInstance}/send-back', [TaskApiController::class, 'sendBack']);

    Route::post('/push-token', [PushSubscriptionApiController::class, 'store']);

    Route::get('/orders/{order}', [OrderApiController::class, 'show']);

    Route::middleware('permission:stage.intake')->group(function () {
        Route::post('/orders', [OrderApiController::class, 'store']);
    });
});
