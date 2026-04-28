param(
  [switch]$OmitirFrontend,
  [switch]$OmitirBackend
)

$ErrorActionPreference = "Stop"

Write-Host "== Inventario Salud Ambiental: preparacion local ==" -ForegroundColor Cyan

if (-not $OmitirBackend) {
  Write-Host "`n[1/3] Backend Laravel" -ForegroundColor Yellow
  Set-Location "c:\Users\soudr\Desktop\Inventario-SaludAmbiental\BackEnd\api"

  if (-not (Get-Command php -ErrorAction SilentlyContinue)) {
    Write-Host "PHP no esta disponible en PATH." -ForegroundColor Red
    exit 1
  }

  if (-not (Get-Command composer -ErrorAction SilentlyContinue)) {
    Write-Host "Composer no esta disponible en PATH. Instalar composer para ejecutar backend." -ForegroundColor Red
    exit 1
  }

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo .env creado desde .env.example"
  }

  composer install --no-interaction --prefer-dist
  php artisan key:generate
  php artisan migrate --force
  php artisan db:seed --class=InventoryCatalogSeeder --force
}

if (-not $OmitirFrontend) {
  Write-Host "`n[2/3] Frontend React" -ForegroundColor Yellow
  Set-Location "c:\Users\soudr\Desktop\Inventario-SaludAmbiental\FrontEnd\app"

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo FrontEnd/app/.env creado desde .env.example"
  }

  npm install
  npm run lint
  npm run build
}

Write-Host "`n[3/3] Arranque de desarrollo" -ForegroundColor Yellow
Write-Host "Backend:  cd BackEnd/api  && php artisan serve"
Write-Host "Frontend: cd FrontEnd/app && npm run dev"
Write-Host "`nPreparacion completada." -ForegroundColor Green
