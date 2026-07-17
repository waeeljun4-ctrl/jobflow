<?php

namespace App\Services;

use Mpdf\Mpdf;

/**
 * Shared setup for every generated PDF (quotes, order reports, ...): an
 * accent color sampled from the company logo, and a faint logo watermark.
 *
 * Font: deliberately left on mPDF's own default Arabic handling
 * (autoScriptToLang/autoLangToFont ON, using its bundled "xbriyaz" font).
 * Two things were tried and reverted here — worth remembering before
 * touching this again:
 *  1. Turning autoScriptToLang/autoLangToFont OFF to force a custom font
 *     breaks Arabic entirely (letters render disconnected and reversed —
 *     that mechanism drives mPDF's Arabic BIDI/joining, not just font
 *     choice).
 *  2. Keeping it ON but redefining the `xbriyaz` font entry to point at
 *     Tahoma's TTF (with `useOTL` on) crashes mPDF's OTL shaper with
 *     thousands of "uninitialized string offset" warnings — Tahoma's font
 *     tables aren't structured the way mPDF's Arabic OTL parser expects.
 * A genuinely nicer Arabic font needs one that's verified to carry proper
 * Arabic OTL (GSUB/GPOS) tables — e.g. Amiri or Noto Naskh Arabic — not
 * just any system font with Arabic glyph coverage.
 */
class PdfBrandingService
{
    public function makePdf(): Mpdf
    {
        $mpdf = new Mpdf([
            'mode' => 'utf-8',
            'format' => 'A4',
            'directionality' => 'rtl',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 15,
            'margin_bottom' => 15,
        ]);
        $mpdf->autoScriptToLang = true;
        $mpdf->autoLangToFont = true;

        return $mpdf;
    }

    public function applyWatermark(Mpdf $mpdf, ?string $logoPath): void
    {
        if (! $logoPath) {
            return;
        }

        $mpdf->SetWatermarkImage($logoPath, 0.07, 'D', 'P');
        $mpdf->showWatermarkImage = true;
    }

    /**
     * Averages the logo's non-transparent, non-white/black pixels to get a
     * usable "brand" color, plus a light 82%-toward-white tint of it for
     * backgrounds — so section headers/totals visually match the logo
     * instead of a fixed hardcoded color.
     *
     * @return array{0: string, 1: string}
     */
    public function extractAccentColor(?string $path): array
    {
        $fallback = ['#5b6b3f', '#e9edc9'];
        if (! $path) {
            return $fallback;
        }

        $info = @getimagesize($path);
        $mime = $info['mime'] ?? '';
        $img = match ($mime) {
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => @imagecreatefromwebp($path),
            default => @imagecreatefromjpeg($path),
        };

        if (! $img) {
            return $fallback;
        }

        $width = imagesx($img);
        $height = imagesy($img);
        $hasAlpha = in_array($mime, ['image/png', 'image/gif', 'image/webp'], true);

        $rTotal = $gTotal = $bTotal = $count = 0;
        $stepX = max(1, intdiv($width, 40));
        $stepY = max(1, intdiv($height, 40));

        for ($x = 0; $x < $width; $x += $stepX) {
            for ($y = 0; $y < $height; $y += $stepY) {
                $rgb = imagecolorat($img, $x, $y);

                if ($hasAlpha && (($rgb >> 24) & 0x7F) > 100) {
                    continue;
                }

                $r = ($rgb >> 16) & 0xFF;
                $g = ($rgb >> 8) & 0xFF;
                $b = $rgb & 0xFF;
                $brightness = ($r + $g + $b) / 3;

                if ($brightness > 235 || $brightness < 20) {
                    continue;
                }

                $rTotal += $r;
                $gTotal += $g;
                $bTotal += $b;
                $count++;
            }
        }
        imagedestroy($img);

        if ($count === 0) {
            return $fallback;
        }

        $r = intdiv($rTotal, $count);
        $g = intdiv($gTotal, $count);
        $b = intdiv($bTotal, $count);

        $accent = sprintf('#%02x%02x%02x', $r, $g, $b);
        $light = sprintf(
            '#%02x%02x%02x',
            (int) min(255, $r + (255 - $r) * 0.82),
            (int) min(255, $g + (255 - $g) * 0.82),
            (int) min(255, $b + (255 - $b) * 0.82)
        );

        return [$accent, $light];
    }

    /**
     * Fits the logo's largest side to a fixed size so it reads as
     * consistently "full" in a header regardless of the source file's
     * actual resolution — small icons get scaled up (capped at 4x to avoid
     * visible pixelation), oversized uploads get scaled down. Aspect ratio
     * is always preserved.
     *
     * @return array{0: int, 1: int}
     */
    public function fitLogoBox(?string $path, int $targetMax = 64): array
    {
        if (! $path) {
            return [0, 0];
        }

        $info = @getimagesize($path);
        if (! $info) {
            return [$targetMax, $targetMax];
        }

        [$width, $height] = $info;
        $scale = min($targetMax / max($width, $height), 4.0);

        return [max(1, (int) round($width * $scale)), max(1, (int) round($height * $scale))];
    }
}
