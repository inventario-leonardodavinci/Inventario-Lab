<?php

namespace App\Console\Commands;

use App\Models\Articulo;
use App\Models\Categoria;
use App\Models\Ubicacion;
use App\Models\NivelStock;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use PhpOffice\PhpSpreadsheet\IOFactory;

/**
 * Importa inventario desde archivos Excel del departamento.
 * Ubicación: Data/*.xlsx
 */
class ImportarInventarioExcel extends Command
{
    protected $signature = 'inventario:importar-excel
                            {--archivo= : Archivo específico a importar}
                            {--limpiar : Limpiar tablas antes de importar}
                            {--dry-run : Simular sin guardar}';

    protected $description = 'Importa artículos desde archivos Excel de la carpeta Data';

    private array $resumen = [
        'articulos_creados' => 0,
        'articulos_actualizados' => 0,
        'categorias_creadas' => 0,
        'ubicaciones_creadas' => 0,
        'errores' => [],
    ];

    private array $categoriasCache = [];
    private array $ubicacionesCache = [];

    public function handle(): int
    {
        $this->info('=== Importación de Inventario desde Excel ===\n');

        // Obtener ruta de la carpeta Data (relativa al proyecto raíz)
        $dataPath = base_path('../Data');
        if (!is_dir($dataPath)) {
            $dataPath = 'C:\xampp\htdocs\Inventario-SaludAmbiental\Data';
        }

        if (!is_dir($dataPath)) {
            $this->error("No se encontró la carpeta Data: {$dataPath}");
            return self::FAILURE;
        }

        // Limpiar si se solicita
        if ($this->option('limpiar')) {
            $this->limpiarTablas();
        }

        // Cargar categorías y ubicaciones existentes
        $this->cargarCaches();

        // Determinar archivos a procesar
        $archivoEspecifico = $this->option('archivo');
        $archivos = $this->obtenerArchivos($dataPath, $archivoEspecifico);

        if (empty($archivos)) {
            $this->error('No se encontraron archivos Excel para importar.');
            return self::FAILURE;
        }

        $this->info('Archivos a procesar: ' . count($archivos));
        foreach ($archivos as $archivo) {
            $this->info("  - {$archivo['nombre']}");
        }
        $this->newLine();

        // Procesar cada archivo
        foreach ($archivos as $archivo) {
            $this->procesarArchivo($archivo['ruta'], $archivo['tipo']);
        }

        // Mostrar resumen
        $this->mostrarResumen();

        return empty($this->resumen['errores']) ? self::SUCCESS : self::SUCCESS;
    }

    private function limpiarTablas(): void
    {
        $this->warn('Limpiando tablas de inventario...');

        if ($this->option('dry-run')) {
            $this->info('[DRY-RUN] Se limpiarían: articulos, niveles_stock');
            return;
        }

        DB::transaction(function () {
            // Desactivar triggers/checks según el driver
            $driver = DB::getDriverName();
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=0');
            } elseif ($driver === 'pgsql') {
                DB::statement('SET session_replication_role = replica');
            }

            NivelStock::query()->delete();
            // Alerta::query()->delete(); // Tabla alertas eliminada del sistema
            \App\Models\Movimiento::query()->delete();
            \App\Models\LineaMovimiento::query()->delete();
            Articulo::query()->delete();
            // Mantener categorías y ubicaciones como referencia

            // Reactivar
            if ($driver === 'mysql') {
                DB::statement('SET FOREIGN_KEY_CHECKS=1');
            } elseif ($driver === 'pgsql') {
                DB::statement('SET session_replication_role = DEFAULT');
            }
        });

        $this->info('Tablas limpiadas.\n');
    }

    private function cargarCaches(): void
    {
        $this->categoriasCache = Categoria::pluck('id', 'nombre')->toArray();
        $this->ubicacionesCache = Ubicacion::pluck('id', 'nombre')->toArray();

        $this->info('Caché cargado:');
        $this->info('  Categorías: ' . count($this->categoriasCache));
        $this->info('  Ubicaciones: ' . count($this->ubicacionesCache));
        $this->newLine();
    }

    private function obtenerArchivos(string $dataPath, ?string $archivoEspecifico): array
    {
        $archivos = [];

        if ($archivoEspecifico) {
            $ruta = $dataPath . '/' . $archivoEspecifico;
            if (file_exists($ruta)) {
                $archivos[] = [
                    'ruta' => $ruta,
                    'nombre' => $archivoEspecifico,
                    'tipo' => $this->detectarTipoArchivo($archivoEspecifico),
                ];
            }
            return $archivos;
        }

        $exts = ['*.xlsx', '*.xls'];
        foreach ($exts as $ext) {
            foreach (glob("{$dataPath}/{$ext}") as $ruta) {
                $nombre = basename($ruta);
                $archivos[] = [
                    'ruta' => $ruta,
                    'nombre' => $nombre,
                    'tipo' => $this->detectarTipoArchivo($nombre),
                ];
            }
        }

        return $archivos;
    }

    private function detectarTipoArchivo(string $nombre): string
    {
        $nombre = strtolower($nombre);

        if (str_contains($nombre, 'fungible')) return 'fungible';
        if (str_contains($nombre, 'vidrio')) return 'vidrio';
        if (str_contains($nombre, 'medio') || str_contains($nombre, 'cultivo')) return 'medios_cultivo';
        if (str_contains($nombre, 'reactivo') || str_contains($nombre, 'quimica')) return 'reactivos';

        return 'general';
    }

    private function procesarArchivo(string $ruta, string $tipo): void
    {
        $this->info("Procesando: {$ruta}");
        $this->info("Tipo detectado: {$tipo}");

        try {
            $reader = IOFactory::createReaderForFile($ruta);
            $reader->setReadDataOnly(true);
            $spreadsheet = $reader->load($ruta);
            $sheet = $spreadsheet->getActiveSheet();

            $filas = $sheet->toArray();
            $this->info('Filas totales: ' . count($filas));

            // Detectar encabezados (primera fila)
            $encabezados = array_shift($filas);
            $this->info('Encabezados: ' . implode(', ', array_slice($encabezados, 0, 5)) . '...');

            // Mapear según tipo de archivo
            $mapeo = $this->obtenerMapeo($tipo, $encabezados);

            $procesadas = 0;
            foreach ($filas as $index => $fila) {
                if ($this->filaVacia($fila)) continue;

                $this->procesarFila($fila, $mapeo, $tipo, $index + 2);
                $procesadas++;

                if ($procesadas % 10 === 0) {
                    $this->output->write('.');
                }
            }

            $this->newLine();
            $this->info("Filas procesadas: {$procesadas}\n");

        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            Log::error('Error importando Excel', ['archivo' => $ruta, 'error' => $e->getMessage()]);
        }
    }

    private function obtenerMapeo(string $tipo, array $encabezados): array
    {
        // Mapeos flexibles según el tipo de archivo
        $mapeos = [
            'fungible' => [
                'nombre' => ['item', 'material', 'nombre', 'descripcion'],
                'material' => ['material', 'tipo'],
                'capacidad' => ['capacidad', 'capacidad (ml)', 'ml'],
                'cantidad' => ['numero', 'cantidad', 'stock', 'unidades'],
                'ubicacion' => ['armario', 'ubicacion', 'localizacion', 'sitio'],
                'notas' => ['observaciones', 'notas', 'comentarios'],
                'categoria_fija' => 'Fungibles',
            ],
            'vidrio' => [
                'nombre' => ['material', 'item', 'nombre', 'descripcion'],
                'tipo_material' => ['tipo', 'material', 'categoria'],
                'capacidad' => ['capacidad (ml)', 'capacidad', 'ml'],
                'cantidad' => ['cantidad', 'numero', 'stock'],
                'ubicacion' => ['armario', 'ubicacion', 'localizacion'],
                'categoria_fija' => 'Material de vidrio',
            ],
            'medios_cultivo' => [
                'nombre' => ['medio', 'nombre', 'item', 'descripcion'],
                'referencia' => ['referencia', 'ref', 'codigo'],
                'cantidad' => ['cantidad', 'numero', 'stock', 'unidades'],
                'ubicacion' => ['ubicacion', 'armario', 'localizacion', 'nevera'],
                'categoria_fija' => 'Medios de cultivo',
            ],
            'reactivos' => [
                'nombre' => ['reactivo', 'nombre', 'item', 'descripcion'],
                'formula' => ['formula', 'composicion'],
                'cantidad' => ['cantidad', 'numero', 'stock'],
                'ubicacion' => ['ubicacion', 'armario', 'localizacion'],
                'categoria_fija' => 'Reactivos',
            ],
            'general' => [
                'nombre' => ['nombre', 'item', 'material', 'descripcion', 'producto'],
                'cantidad' => ['cantidad', 'numero', 'stock', 'unidades', 'total'],
                'ubicacion' => ['ubicacion', 'armario', 'localizacion', 'sitio'],
            ],
        ];

        $mapeo = $mapeos[$tipo] ?? $mapeos['general'];

        // Buscar índices de columnas basándose en encabezados
        $indices = [];
        foreach ($mapeo as $campo => $posiblesNombres) {
            if ($campo === 'categoria_fija') {
                $indices[$campo] = $posiblesNombres;
                continue;
            }

            foreach ($posiblesNombres as $posible) {
                $index = $this->buscarIndiceColumna($encabezados, $posible);
                if ($index !== null) {
                    $indices[$campo] = $index;
                    break;
                }
            }
        }

        return $indices;
    }

    private function buscarIndiceColumna(array $encabezados, string $busqueda): ?int
    {
        $busqueda = strtolower(trim($busqueda));
        foreach ($encabezados as $index => $encabezado) {
            $encabezado = strtolower(trim((string)$encabezado));
            if (str_contains($encabezado, $busqueda)) {
                return $index;
            }
        }
        return null;
    }

    private function filaVacia(array $fila): bool
    {
        foreach ($fila as $valor) {
            if ($valor !== null && $valor !== '') {
                return false;
            }
        }
        return true;
    }

    private function procesarFila(array $fila, array $mapeo, string $tipo, int $numeroFila): void
    {
        // Extraer valores
        $nombre = $this->extraerValor($fila, $mapeo, 'nombre');
        if (empty($nombre)) {
            return; // Saltar filas sin nombre
        }

        $cantidad = $this->extraerValor($fila, $mapeo, 'cantidad', 0);
        $ubicacionNombre = $this->extraerValor($fila, $mapeo, 'ubicacion', 'General');
        $categoriaNombre = $mapeo['categoria_fija'] ?? 'General';

        if ($this->option('dry-run')) {
            $this->info("[DRY-RUN] Fila {$numeroFila}: {$nombre} ({$cantidad} unidades)");
            return;
        }

        try {
            DB::transaction(function () use ($nombre, $cantidad, $ubicacionNombre, $categoriaNombre, $fila, $mapeo, $numeroFila) {
                // Crear o obtener categoría
                $categoriaId = $this->obtenerOCrearCategoria($categoriaNombre);

                // Crear o obtener ubicación
                $ubicacionId = $this->obtenerOCrearUbicacion($ubicacionNombre);

                // Crear o actualizar artículo
                $articulo = Articulo::firstOrNew(['nombre' => $nombre]);

                if (!$articulo->exists) {
                    $articulo->fill([
                        'categoria_id' => $categoriaId,
                        'codigo' => null,
                        'descripcion' => $this->extraerValor($fila, $mapeo, 'material') ??
                                        $this->extraerValor($fila, $mapeo, 'tipo_material') ??
                                        $this->extraerValor($fila, $mapeo, 'formula'),
                        'unidad' => $this->detectarUnidad($nombre),
                        'notas' => $this->extraerValor($fila, $mapeo, 'notas'),
                        'activo' => true,
                    ]);
                    $articulo->save();
                    $this->resumen['articulos_creados']++;
                } else {
                    $this->resumen['articulos_actualizados']++;
                }

                // Crear nivel de stock para la ubicación
                NivelStock::updateOrCreate(
                    [
                        'articulo_id' => $articulo->id,
                        'ubicacion_id' => $ubicacionId,
                    ],
                    [
                        'cantidad' => max(0, (int)$cantidad),
                        'cantidad_minima' => 1,
                    ]
                );
            });
        } catch (\Exception $e) {
            $error = "Fila {$numeroFila}: {$e->getMessage()}";
            $this->resumen['errores'][] = $error;
            Log::error($error, ['fila' => $fila]);
        }
    }

    private function extraerValor(array $fila, array $mapeo, string $campo, mixed $default = null): mixed
    {
        if (!isset($mapeo[$campo])) {
            return $default;
        }

        $indice = $mapeo[$campo];
        $valor = $fila[$indice] ?? $default;

        if (is_string($valor)) {
            $valor = trim($valor);
        }

        return $valor ?: $default;
    }

    private function obtenerOCrearCategoria(string $nombre): int
    {
        if (isset($this->categoriasCache[$nombre])) {
            return $this->categoriasCache[$nombre];
        }

        $categoria = Categoria::firstOrCreate(
            ['nombre' => $nombre],
            ['total_articulos' => 0]
        );

        $this->categoriasCache[$nombre] = $categoria->id;
        $this->resumen['categorias_creadas']++;

        return $categoria->id;
    }

    private function obtenerOCrearUbicacion(string $nombre): int
    {
        // Normalizar nombre de ubicación
        $nombre = $this->normalizarUbicacion($nombre);

        if (isset($this->ubicacionesCache[$nombre])) {
            return $this->ubicacionesCache[$nombre];
        }

        $ubicacion = Ubicacion::firstOrCreate(
            ['nombre' => $nombre],
            [
                'descripcion' => 'Importado desde Excel',
                'tipo' => $this->detectarTipoUbicacion($nombre),
            ]
        );

        $this->ubicacionesCache[$nombre] = $ubicacion->id;
        $this->resumen['ubicaciones_creadas']++;

        return $ubicacion->id;
    }

    private function normalizarUbicacion(string $nombre): string
    {
        $nombre = trim((string)$nombre);

        // Mapeo de números de armario a nombres descriptivos
        $mapeos = [
            '1' => 'Armario bajo 1',
            '2' => 'Armario bajo 2',
            '3' => 'Armario bajo 3',
            '4' => 'Armario bajo 4',
            '5' => 'Armario bajo 5',
            '6' => 'Armario bajo 6',
            '7' => 'Armario bajo 7',
            '8' => 'Armario bajo 8',
            '9' => 'Armario bajo 9',
            '10' => 'Armario bajo 10',
        ];

        return $mapeos[$nombre] ?? $nombre;
    }

    private function detectarTipoUbicacion(string $nombre): string
    {
        $nombre = strtolower($nombre);

        if (str_contains($nombre, 'nevera')) return 'nevera';
        if (str_contains($nombre, 'vitrina')) return 'vitrina';
        if (str_contains($nombre, 'cajon')) return 'cajon';
        if (str_contains($nombre, 'estanteria')) return 'estanteria';
        if (str_contains($nombre, 'armario')) return 'armario';

        return 'otro';
    }

    private function detectarUnidad(string $nombre): ?string
    {
        $nombre = strtolower($nombre);

        if (str_contains($nombre, 'ml') || str_contains($nombre, 'litro')) return 'mL';
        if (str_contains($nombre, 'g ') || str_contains($nombre, 'gramo')) return 'g';
        if (str_contains($nombre, 'kg') || str_contains($nombre, 'kilo')) return 'kg';
        if (str_contains($nombre, 'caja')) return 'caja';
        if (str_contains($nombre, 'bote')) return 'bote';
        if (str_contains($nombre, 'frasco')) return 'frasco';
        if (str_contains($nombre, 'rollo')) return 'rollo';

        return 'uds';
    }

    private function mostrarResumen(): void
    {
        $this->newLine();
        $this->info('=== RESUMEN DE IMPORTACIÓN ===');
        $this->info('Artículos creados: ' . $this->resumen['articulos_creados']);
        $this->info('Artículos actualizados: ' . $this->resumen['articulos_actualizados']);
        $this->info('Categorías creadas: ' . $this->resumen['categorias_creadas']);
        $this->info('Ubicaciones creadas: ' . $this->resumen['ubicaciones_creadas']);

        if (!empty($this->resumen['errores'])) {
            $this->newLine();
            $this->warn('Errores encontrados: ' . count($this->resumen['errores']));
            foreach (array_slice($this->resumen['errores'], 0, 10) as $error) {
                $this->error('  - ' . $error);
            }
            if (count($this->resumen['errores']) > 10) {
                $this->error('  ... y ' . (count($this->resumen['errores']) - 10) . ' más');
            }
        }

        $this->newLine();
        $this->info('Importación completada.');
    }
}
