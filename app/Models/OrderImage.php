<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class OrderImage extends Model
{
    protected $fillable = ['order_id', 'path', 'uploaded_by'];

    protected $appends = ['url'];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    /**
     * A relative path (not Storage::url()'s absolute APP_URL-based one) so
     * it resolves correctly no matter which host/port the app is actually
     * being accessed through (LAN IP from the mobile app, localhost during
     * dev, or the real domain later) — APP_URL doesn't have to match reality.
     */
    protected function url(): Attribute
    {
        return Attribute::make(
            get: fn () => '/storage/'.$this->path,
        );
    }
}
