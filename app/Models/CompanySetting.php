<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

class CompanySetting extends Model
{
    protected $fillable = ['name', 'phone', 'address', 'logo_path'];

    protected $appends = ['logo_url'];

    protected function logoUrl(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->logo_path ? '/storage/'.$this->logo_path : null,
        );
    }

    /**
     * Single-row settings — creates the row with a placeholder name on
     * first access so callers never have to null-check it.
     */
    public static function current(): self
    {
        return static::query()->firstOrCreate([], ['name' => 'اسم الشركة']);
    }
}
