param(
  [switch]$OmitirFrontend,
  [switch]$OmitirBackend
)

$ErrorActionPreference = "Stop"

Write-Host "== Inventario Salud Ambiental: preparacion local ==" -ForegroundColor Cyan

$scriptDir = if ($PSScriptRoot) { $PSScriptRoot } else { "C:\Users\soudr\Desktop\Inventario-SaludAmbiental" }

function Descargar-Archivo {
  param($url, $destino)
  try {
    Write-Host "Descargando $url..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri $url -OutFile $destino -UseBasicParsing
    Write-Host "Descargado: $destino" -ForegroundColor Green
    return $true
  } catch {
    Write-Host "Error al descargar: $_" -ForegroundColor Red
    return $false
  }
}

if (-not $OmitirBackend) {
  Write-Host "`n[1/3] Backend Laravel" -ForegroundColor Yellow
  Set-Location "$scriptDir\backend\api"

  if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP no esta disponible en PATH." -ForegroundColor Red
    exit 1
  }

  $composerPhar = "$scriptDir\composer.phar"
  if (-not (Test-Path $composerPhar)) {
    Descargar-Archivo "https://getcomposer.org/composer.phar" $composerPhar
  }
  if (-not (Test-Path $composerPhar)) {
    Write-Host "Composer no disponible. Instalar manualmente desde https://getcomposer.org" -ForegroundColor Red
    exit 1
  }
  Write-Host "Composer: $composerPhar" -ForegroundColor Green

  $cacert = "$scriptDir\cacert.pem"
  if (-not (Test-Path $cacert)) {
    Descargar-Archivo "https://curl.se/ca/cacert.pem" $cacert
  }
  if (Test-Path $cacert) {
    $env:COMPOSER_CAFILE = $cacert
    Write-Host "SSL: usando cacert.pem" -ForegroundColor Green
  }

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env creado" -ForegroundColor Green
  }

  Write-Host "Ejecutando composer install..." -ForegroundColor Cyan
  $hasCurl = (php -m | Out-String).ToLower().Contains("curl")
  if (-not $hasCurl) {
    Write-Host "ADVERTENCIA: curl no disponible." -ForegroundColor Yellow
  }
  Write-Host "Instalando dependencias (esto puede tardar)..." -ForegroundColor Cyan
  & php $composerPhar install --no-interaction --prefer-dist *> $null
  if ($LASTEXITCODE -ne 0 -or -not (Test-Path "vendor/autoload.php")) {
    Write-Host "Reintentando sin SSL..." -ForegroundColor Yellow
    & php $composerPhar install --no-interaction --prefer-dist --repository-url=http://repo.packagist.org *> $null
  }
  if (Test-Path "vendor/autoload.php") {
    Write-Host "dependencias instaladas" -ForegroundColor Green
    php artisan key:generate
    php artisan migrate --force
    php artisan db:seed --class=InventoryCatalogSeeder --force
  } else {
    Write-Host "ERROR: composer install fallo. Verifica PHP/curl." -ForegroundColor Red
  }
}

if (-not $OmitirFrontend) {
  Write-Host "`n[2/3] Frontend React" -ForegroundColor Yellow
  Set-Location "$scriptDir\frontend\app"

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host ".env creado" -ForegroundColor Green
  }

  npm install
  npm run lint
  npm run build
}

Write-Host "`n[3/3] Arranque de desarrollo" -ForegroundColor Yellow
Write-Host "Backend:  cd backend/api  && php artisan serve"
Write-Host "Frontend: cd frontend/app && npm run dev"
Write-Host "`nPreparacion completada." -ForegroundColor Green
