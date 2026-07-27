<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Supplier extends Model
{
    protected $fillable = ['name', 'phone', 'notes'];

    public function ledgerEntries(): MorphMany
    {
        return $this->morphMany(LedgerEntry::class, 'partyable')->latest('entry_date')->latest('id');
    }
}
