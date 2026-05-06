<?php

declare(strict_types=1);

namespace App\Http\Helpers;

use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

/**
 * Helper estandarizado para respuestas API JSON.
 * 
 * Usar este helper en todos los controladores para mantener
 * consistencia en las respuestas de la API.
 */
class ApiResponse
{
    /**
     * Respuesta exitosa estándar.
     *
     * @param array<string, mixed> $data Datos a retornar
     * @param string|null $message Mensaje opcional
     * @param int $status Código HTTP (default: 200 OK)
     */
    public static function success(
        array $data = [],
        ?string $message = null,
        int $status = Response::HTTP_OK
    ): JsonResponse {
        $response = ['data' => $data];
        
        if ($message !== null) {
            $response['message'] = $message;
        }

        return new JsonResponse($response, $status);
    }

    /**
     * Respuesta exitosa con paginación.
     *
     * @param array<string, mixed> $data Datos paginados
     * @param array<string, mixed> $meta Metadatos de paginación
     */
    public static function paginated(
        array $data,
        array $meta
    ): JsonResponse {
        return new JsonResponse([
            'data' => $data,
            'meta' => $meta,
        ], Response::HTTP_OK);
    }

    /**
     * Respuesta de error.
     *
     * @param string $message Mensaje de error
     * @param int $status Código HTTP de error
     * @param array<string, mixed>|null $errors Detalles adicionales de error
     */
    public static function error(
        string $message,
        int $status = Response::HTTP_BAD_REQUEST,
        ?array $errors = null
    ): JsonResponse {
        $response = [
            'message' => $message,
            'status' => $status,
        ];

        if ($errors !== null) {
            $response['errors'] = $errors;
        }

        return new JsonResponse($response, $status);
    }

    /**
     * Error de validación (422 Unprocessable Entity).
     *
     * @param array<string, array<string>> $validationErrors Errores de validación
     */
    public static function validationError(array $validationErrors): JsonResponse
    {
        return self::error(
            'Datos de entrada inválidos.',
            Response::HTTP_UNPROCESSABLE_ENTITY,
            $validationErrors
        );
    }

    /**
     * Recurso no encontrado (404 Not Found).
     *
     * @param string $resource Nombre del recurso
     * @param int|string|null $id ID del recurso buscado
     */
    public static function notFound(string $resource = 'Recurso', int|string|null $id = null): JsonResponse
    {
        $message = $id !== null
            ? "{$resource} con ID '{$id}' no encontrado."
            : "{$resource} no encontrado.";

        return self::error($message, Response::HTTP_NOT_FOUND);
    }

    /**
     * No autorizado (401 Unauthorized).
     *
     * @param string|null $message Mensaje personalizado
     */
    public static function unauthorized(?string $message = null): JsonResponse
    {
        return self::error(
            $message ?? 'No autorizado. Inicia sesión primero.',
            Response::HTTP_UNAUTHORIZED
        );
    }

    /**
     * Prohibido - Sin permisos (403 Forbidden).
     *
     * @param array<string>|null $permisosRequeridos Lista de permisos requeridos
     */
    public static function forbidden(?array $permisosRequeridos = null): JsonResponse
    {
        $response = [
            'message' => 'No tienes permiso para realizar esta acción.',
        ];

        if ($permisosRequeridos !== null) {
            $response['permisos_requeridos'] = $permisosRequeridos;
        }

        return new JsonResponse($response, Response::HTTP_FORBIDDEN);
    }

    /**
     * Error interno del servidor (500 Internal Server Error).
     *
     * @param string|null $message Mensaje de error (solo en desarrollo)
     */
    public static function serverError(?string $message = null): JsonResponse
    {
        return self::error(
            'Error interno del servidor.',
            Response::HTTP_INTERNAL_SERVER_ERROR,
            config('app.debug') && $message !== null ? ['debug' => $message] : null
        );
    }

    /**
     * Recurso creado exitosamente (201 Created).
     *
     * @param array<string, mixed> $data Datos del recurso creado
     * @param string|null $message Mensaje opcional
     */
    public static function created(array $data, ?string $message = null): JsonResponse
    {
        return self::success($data, $message ?? 'Recurso creado exitosamente.', Response::HTTP_CREATED);
    }

    /**
     * Recurso eliminado exitosamente (204 No Content o 200 con mensaje).
     *
     * @param string|null $message Si se proporciona, retorna 200; si no, 204
     */
    public static function deleted(?string $message = null): JsonResponse
    {
        if ($message === null) {
            return new JsonResponse(null, Response::HTTP_NO_CONTENT);
        }

        return self::success([], $message);
    }
}
