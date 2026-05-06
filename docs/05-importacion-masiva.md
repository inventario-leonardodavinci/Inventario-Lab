# Importación Masiva desde Excel

## Instalación de dependencia

Primero instala la librería para leer Excel:

```bash
cd backend/api
composer require phpoffice/phpspreadsheet --disable-tls
```

Si tienes problemas con SSL, prueba:
```bash
composer config --global disable-tls true
composer require phpoffice/phpspreadsheet
composer config --global disable-tls false
```

## Uso del comando

### Ver ayuda
```bash
php artisan inventario:importar-excel --help
```

### Simular importación (sin guardar)
```bash
php artisan inventario:importar-excel --dry-run
```

### Importar todos los archivos de Data/
```bash
php artisan inventario:importar-excel
```

### Limpiar e importar (¡CUIDADO! Borra artículos existentes)
```bash
php artisan inventario:importar-excel --limpiar
```

### Importar un archivo específico
```bash
php artisan inventario:importar-excel --archivo="Inventario Material fungible laboratorio.xlsx"
```

## Archivos soportados

El comando detecta automáticamente el tipo de archivo basándose en su nombre:

| Tipo detectado | Palabras clave en nombre | Categoría asignada |
|----------------|---------------------------|-------------------|
| Fungible | "fungible" | Fungibles |
| Vidrio | "vidrio" | Material de vidrio |
| Medios de cultivo | "medio", "cultivo" | Medios de cultivo |
| Reactivos | "reactivo", "quimica" | Reactivos |
| General | otros | General |

## Mapeo de columnas

El comando intenta detectar automáticamente las columnas basándose en los encabezados:

### Columnas buscadas (en orden de prioridad)

- **Nombre**: Item, Material, Nombre, Descripción
- **Cantidad**: Numero, Cantidad, Stock, Unidades
- **Ubicación**: Armario, Ubicación, Localización, Sitio
- **Material/Tipo**: Material, Tipo, Categoría
- **Notas**: Observaciones, Notas, Comentarios

### Normalización de ubicaciones

Los números de armario se convierten automáticamente:
- `1` → `Armario bajo 1`
- `2` → `Armario bajo 2`
- etc.

## Proceso de importación

1. **Lee el archivo Excel** activo (primera hoja)
2. **Detecta encabezados** (primera fila)
3. **Mapea columnas** según coincidencias de nombre
4. **Crea categorías** automáticamente si no existen
5. **Crea ubicaciones** automáticamente si no existen
6. **Crea artículos** (o actualiza si ya existen por nombre)
7. **Crea niveles de stock** para cada ubicación

## Validaciones

- Filas sin nombre se saltan
- Cantidad vacía = 0
- Ubicación vacía = "General"
- Artículos duplicados (mismo nombre) se actualizan, no se recrean

## Resumen de salida

Al finalizar muestra:
- Artículos creados
- Artículos actualizados
- Categorías creadas
- Ubicaciones creadas
- Errores encontrados (si los hay)

## Archivos de ejemplo en Data/

- `Inventario Material fungible laboratorio.xlsx`
- `Medios cultivo L201.xlsx`
- `Plantilla_Inventario_Laboratorio_MATERIAL DE VIDRIO.xlsx`
- `Plantilla_Inventario_Laboratorio_MEDIOS DE CULTIVO.xlsx`
- `Plantilla_Inventario_Laboratorio_REACTIVOS QUÍMICA.xlsx`

## Solución de problemas

### Error de memoria
Si el archivo es muy grande:
```bash
php -d memory_limit=512M artisan inventario:importar-excel
```

### Error de SSL al instalar
```bash
composer config disable-tls true
composer require phpoffice/phpspreadsheet
composer config disable-tls false
```

### Timeout
```bash
php artisan inventario:importar-excel --timeout=300
```
