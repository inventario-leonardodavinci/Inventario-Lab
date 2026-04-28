param(
  [switch]$OmitirFrontend,
  [switch]$OmitirBackend
)

$ErrorActionPreference = "Stop"

Write-Host "== Inventario Salud Ambiental: preparacion local ==" -ForegroundColor Cyan

if (-not $OmitirBackend) {
  Write-Host "`n[1/3] Backend Laravel" -ForegroundColor Yellow
  Set-Location "c:\Users\soudr\Desktop\Inventario-SaludAmbiental\backend\api"

  if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP no esta disponible en PATH." -ForegroundColor Red
    exit 1
  }

  $scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { "C:\Users\soudr\Desktop\Inventario-SaludAmbiental" }
  $composerPhar = $null
  $paths = @("$scriptDir\composer.phar", "$scriptDir\backend\api\composer.phar", "C:\ProgramData\Composer\composer.phar", "$env:APPDATA\Composer\vendor\bin\composer.phar")
  foreach ($p in $paths) {
    if (Test-Path $p) { $composerPhar = $p; break }
  }
  if (-not $composerPhar) {
    Write-Host "Composer no encontrado. Descargar de https://getcomposer.org" -ForegroundColor Red
    exit 1
  }
  Write-Host "Composer encontrado: $composerPhar" -ForegroundColor Green

  if ($scriptDir -and (Test-Path "$scriptDir\cacert.pem")) {
    $env:COMPOSER_CAFILE = "$scriptDir\cacert.pem"
    Write-Host "Usando cacert.pem local" -ForegroundColor Green
  }

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado desde .env.example"
  }

  Write-Host "Ejecutando composer install..." -ForegroundColor Cyan
  $hasCurl = (php -m | Out-String).ToLower().Contains("curl")
  if (-not $hasCurl) {
    Write-Host "ADVERTENCIA: Extension curl no disponible. Composer necesita curl para descargar paquetes." -ForegroundColor Yellow
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "  1. Instalar XAMPP/WAMP (incluye curl)" -ForegroundColor Cyan
    Write-Host "  2. Descargar PHP desde https://windows.php.net/downloads/php-8.3.0-Win32-vs16-x64.zip" -ForegroundColor Cyan
    Write-Host "     Extraer solo php.exe y la carpeta ext en una carpeta, luego configurar extension=php_curl.dll en php.ini" -ForegroundColor Cyan
    $continue = Read-Host "Continuar sin composer? (s/n)"
    if ($continue -ne "s") { exit 1 }
  } else {
    & php $composerPhar install --no-interaction --prefer-dist 2>&1 | ForEach-Object { Write-Host $_ }
    if ($LASTEXITCODE -ne 0 -or -not (Test-Path "vendor/autoload.php")) {
      Write-Host "Fallo en composer, reintentando sin SSL..." -ForegroundColor Yellow
      & php $composerPhar install --no-interaction --prefer-dist --repository-url=http://repo.packagist.org 2>&1 | ForEach-Object { Write-Host $_ }
    }
  }
  php artisan key:generate
  php artisan migrate --force
  php artisan db:seed --class=InventoryCatalogSeeder --force
}

if (-not $OmitirFrontend) {
  Write-Host "`n[2/3] Frontend React" -ForegroundColor Yellow
  Set-Location "c:\Users\soudr\Desktop\Inventario-SaludAmbiental\frontend\app"

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado desde .env.example"
  }

  npm install
  npm run lint
  npm run build
}

Write-Host "`n[3/3] Arranque de desarrollo" -ForegroundColor Yellow
Write-Host "Backend:  cd backend/api  && php artisan serve"
Write-Host "Frontend: cd frontend/app && npm run dev"
Write-Host "`nPreparacion completada." -ForegroundColor Green
