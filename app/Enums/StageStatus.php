<?php

namespace App\Enums;

enum StageStatus: string
{
    case Locked = 'locked';
    case Available = 'available';
    case InProgress = 'in_progress';
    case Done = 'done';
}
