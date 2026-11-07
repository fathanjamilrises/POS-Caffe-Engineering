<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'value',
        'group',
    ];

    /**
     * Get a setting by key with a default value.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        try {
            $setting = static::where('key', $key)->first();
            if (! $setting) {
                return $default;
            }

            $decoded = json_decode($setting->value, true);
            if (json_last_error() === JSON_ERROR_NONE && ! is_numeric($setting->value)) {
                return $decoded;
            }

            if ($setting->value === 'true') {
                return true;
            }
            if ($setting->value === 'false') {
                return false;
            }

            return $setting->value;
        } catch (\Throwable) {
            return $default;
        }
    }

    /**
     * Store or update a setting.
     */
    public static function set(string $key, mixed $value, string $group = 'general'): self
    {
        if (is_array($value) || is_object($value)) {
            $formattedValue = json_encode($value);
        } elseif (is_bool($value)) {
            $formattedValue = $value ? 'true' : 'false';
        } else {
            $formattedValue = (string) $value;
        }

        return static::updateOrCreate(
            ['key' => $key],
            [
                'value' => $formattedValue,
                'group' => $group,
            ]
        );
    }
}
