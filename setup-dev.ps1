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

  if (-not (Get-Command composer -ErrorAction SilentlyContinue)) {
    $phpPath = (Get-Command php -ErrorAction SilentlyContinue).Source
    $phpDir = Split-Path $phpPath
    $composers = @("$env:APPDATA\Composer\vendor\bin\composer.phar", "C:\ProgramData\Composer\composer.phar", "$phpDir\composer.phar")
    $found = $false
    foreach ($c in $composers) {
      if (Test-Path $c) {
        Set-Alias -Name composer -Value $c -Scope Script
        $found = $true
        break
      }
    }
    if (-not $found) {
      Write-Host "Composer no esta disponible. Instalar desde https://getcomposer.org" -ForegroundColor Red
      exit 1
    }
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
  Set-Location "c:\Users\soudr\Desktop\Inventario-SaludAmbiental\frontend\app"

  if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Archivo FrontEnd/app/.env creado desde .env.example"
  }

  npm install
  npm run lint
  npm run build
}

Write-Host "`n[3/3] Arranque de desarrollo" -ForegroundColor Yellow
Write-Host "Backend:  cd backend/api  && php artisan serve"
Write-Host "Frontend: cd frontend/app && npm run dev"
Write-Host "`nPreparacion completada." -ForegroundColor Green
