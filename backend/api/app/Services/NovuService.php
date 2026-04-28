<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class NovuService
{
    public function triggerLoginEvent(string $authUserId, string $displayName): void
    {
        $apiKey = config('services.novu.api_key');
        $triggerIdentifier = config('services.novu.login_trigger', 'user-login');
        $apiUrl = rtrim((string) config('services.novu.api_url', 'https://api.novu.co'), '/');

        if (! $apiKey) {
            return;
        }

        Http::withToken($apiKey)
            ->timeout(5)
            ->post("{$apiUrl}/v1/events/trigger", [
                'name' => $triggerIdentifier,
                'to' => [
                    'subscriberId' => $authUserId,
                    'firstName' => $displayName,
                ],
                'payload' => [
                    'title' => 'Inicio de sesion',
                    'message' => 'Has iniciado sesion correctamente.',
                ],
            ]);
    }
}
