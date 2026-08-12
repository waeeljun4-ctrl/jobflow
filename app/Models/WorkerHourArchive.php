<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkerHourArchive extends Model
{
    protected $fillable = ['user_id', 'total_hours', 'archived_by', 'archived_at'];

    protected function casts(): array
    {
        return [
            'total_hours' => 'float',
            'archived_at' => 'datetime',
        ];
    }

    public function worker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function archivedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'archived_by');
    }
}
