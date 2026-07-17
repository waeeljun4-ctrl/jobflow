<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\JpegEncoder;
use Intervention\Image\ImageManager;

/**
 * Re-encodes uploaded photos as quality-60 JPEGs before they hit disk —
 * phone-camera photos routinely arrive at 3-8 MB despite the resolution
 * itself only needing a fraction of that to look identical on screen.
 * Pixel dimensions are never touched, only the compression level, so the
 * image stays exactly as sharp/large as what the customer sent in.
 */
class ImageCompressionService
{
    private const JPEG_QUALITY = 60;

    public function compressAndStore(UploadedFile $file, string $directory, string $disk = 'public'): string
    {
        $manager = new ImageManager(new Driver());
        $encoded = $manager->decodePath($file->getRealPath())
            ->encode(new JpegEncoder(quality: self::JPEG_QUALITY, strip: true));

        $path = $directory.'/'.Str::random(40).'.jpg';
        Storage::disk($disk)->put($path, $encoded->toString());

        return $path;
    }
}
