<#
.SYNOPSIS
  Demarre le serveur de deploiement EcoTrack (Docker + tunnel + 4 microservices + IA)
  puis verifie que tout repond, en local et via le tunnel public.

.DESCRIPTION
  - Lance Docker Desktop s'il n'est pas demarre, puis "docker compose up -d".
  - Ouvre chaque service dans sa propre fenetre PowerShell (a laisser ouverte).
    Un service dont le port est deja occupe n'est PAS relance (evite EADDRINUSE).
  - Attend que chaque service reponde sur /health, puis teste le tunnel ngrok.

.PARAMETER CheckOnly
  N'execute rien : affiche seulement l'etat de Docker, des services et du tunnel.

.EXAMPLE
  npm run deploy:start
  npm run deploy:check
  powershell -ExecutionPolicy Bypass -File scripts\start-deployment.ps1 [-CheckOnly]
#>
param(
  [switch]$CheckOnly
)

$ErrorActionPreference = 'Continue'
$Root = Split-Path -Parent $PSScriptRoot

$Services = @(
  @{ Name = 'identity-api'; Port = 3001; Dir = $Root; Cmd = 'npx ts-node --project services/identity-api/tsconfig.json services/identity-api/src/index.ts' },
  @{ Name = 'report-api';   Port = 3002; Dir = $Root; Cmd = 'npx ts-node services/report-api/src/index.ts' },
  @{ Name = 'workflow-api'; Port = 3003; Dir = $Root; Cmd = 'npx ts-node services/workflow-api/src/index.ts' },
  @{ Name = 'audit-api';    Port = 3004; Dir = $Root; Cmd = 'npx ts-node services/audit-api/src/index.ts' },
  @{ Name = 'ai-vision';    Port = 8000; Dir = (Join-Path $Root 'services\ai-vision'); Cmd = 'python -m uvicorn main:app --host 0.0.0.0 --port 8000' }
)
$GatewayPort = 8090
$ExpectedContainers = @('ecotrack-mongodb', 'ecotrack-postgres-dw', 'ecotrack-redis', 'ecotrack-rabbitmq', 'ecotrack-minio-s3', 'ecotrack-api-gateway', 'ecotrack-tunnel')

function Write-Step([string]$Text) { Write-Host "`n==> $Text" -ForegroundColor Cyan }
function Write-Ok([string]$Text)   { Write-Host "  [OK]  $Text" -ForegroundColor Green }
function Write-Warn([string]$Text) { Write-Host "  [!!]  $Text" -ForegroundColor Yellow }
function Write-Fail([string]$Text) { Write-Host "  [KO]  $Text" -ForegroundColor Red }

function Test-DockerReady {
  & docker info 2>$null | Out-Null
  return ($LASTEXITCODE -eq 0)
}

function Test-PortListening([int]$Port) {
  return [bool](Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue)
}

function Test-Health([string]$Url, [hashtable]$Headers = @{}) {
  try {
    $r = Invoke-WebRequest -Uri $Url -Headers $Headers -UseBasicParsing -TimeoutSec 5
    return ($r.StatusCode -eq 200)
  } catch {
    return $false
  }
}

function Get-EnvValue([string]$Key) {
  $envFile = Join-Path $Root '.env'
  if (-not (Test-Path $envFile)) { return $null }
  $line = Get-Content $envFile | Where-Object { $_ -match "^\s*$Key\s*=" } | Select-Object -First 1
  if (-not $line) { return $null }
  return ($line -split '=', 2)[1].Trim().Trim('"').Trim("'")
}

Write-Host "EcoTrack - serveur de deploiement" -ForegroundColor White
Write-Host "Depot : $Root"
if ($CheckOnly) { Write-Host "Mode verification seule : rien ne sera demarre." -ForegroundColor Yellow }

# --- 1. Docker ----------------------------------------------------------------
Write-Step "Docker"
if (-not (Test-DockerReady)) {
  if ($CheckOnly) {
    Write-Fail "Docker n'est pas demarre."
  } else {
    $dockerDesktop = Join-Path $env:ProgramFiles 'Docker\Docker\Docker Desktop.exe'
    if (-not (Test-Path $dockerDesktop)) {
      Write-Fail "Docker Desktop introuvable ($dockerDesktop). Demarre-le manuellement puis relance ce script."
      exit 1
    }
    Write-Host "  Demarrage de Docker Desktop..."
    Start-Process $dockerDesktop
    $deadline = (Get-Date).AddMinutes(3)
    while (-not (Test-DockerReady)) {
      if ((Get-Date) -gt $deadline) {
        Write-Fail "Docker n'est toujours pas pret apres 3 minutes."
        exit 1
      }
      Start-Sleep -Seconds 3
    }
    Write-Ok "Docker est pret."
  }
} else {
  Write-Ok "Docker est demarre."
}

if (-not $CheckOnly) {
  Write-Host "  docker compose up -d ..."
  Push-Location $Root
  & docker compose up -d 2>&1 | Out-Null
  $composeExit = $LASTEXITCODE
  Pop-Location
  if ($composeExit -ne 0) {
    Write-Fail "docker compose up -d a echoue. Lance-le a la main pour voir l'erreur."
    exit 1
  }
}

if (Test-DockerReady) {
  $running = @(& docker ps --format '{{.Names}}' 2>$null)
  foreach ($c in $ExpectedContainers) {
    if ($running -contains $c) { Write-Ok $c } else { Write-Fail "$c n'est pas lance" }
  }
}

# --- 2. Services --------------------------------------------------------------
Write-Step "Services"
foreach ($s in $Services) {
  if (Test-PortListening $s.Port) {
    Write-Ok "$($s.Name) tourne deja sur le port $($s.Port)."
    continue
  }
  if ($CheckOnly) {
    Write-Fail "$($s.Name) n'est pas lance (port $($s.Port))."
    continue
  }
  $title = "$($s.Name) $($s.Port)"
  $command = "`$host.UI.RawUI.WindowTitle = '$title'; $($s.Cmd)"
  Start-Process powershell -WorkingDirectory $s.Dir -ArgumentList @('-NoExit', '-Command', $command) | Out-Null
  Write-Host "  Lancement de $($s.Name) dans une nouvelle fenetre..."
}

# --- 3. Health checks ---------------------------------------------------------
Write-Step "Verification locale (/health)"
$checks = @($Services | ForEach-Object { @{ Name = $_.Name; Port = $_.Port } }) + @(@{ Name = 'api-gateway'; Port = $GatewayPort })
$timeoutSec = 0
if (-not $CheckOnly) { $timeoutSec = 120 }
$deadline = (Get-Date).AddSeconds($timeoutSec)
$allLocalOk = $true
foreach ($c in $checks) {
  $url = "http://localhost:$($c.Port)/health"
  $ok = Test-Health $url
  while (-not $ok -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 3
    $ok = Test-Health $url
  }
  if ($ok) { Write-Ok "$($c.Name) ($($c.Port))" } else { Write-Fail "$($c.Name) ($($c.Port)) ne repond pas"; $allLocalOk = $false }
}

# --- 4. Public tunnel ---------------------------------------------------------
Write-Step "Tunnel public"
$domain = Get-EnvValue 'NGROK_STATIC_DOMAIN'
$tunnelOk = $false
if (-not $domain) {
  Write-Warn "NGROK_STATIC_DOMAIN absent de .env : tunnel non verifie."
} else {
  $tunnelUrl = "https://$domain/health"
  $tunnelOk = Test-Health $tunnelUrl @{ 'ngrok-skip-browser-warning' = 'true' }
  if (-not $tunnelOk -and -not $CheckOnly) {
    Start-Sleep -Seconds 5
    $tunnelOk = Test-Health $tunnelUrl @{ 'ngrok-skip-browser-warning' = 'true' }
  }
  if ($tunnelOk) {
    Write-Ok "https://$domain repond."
  } else {
    Write-Fail "https://$domain ne repond pas. Voir : docker logs --tail 30 ecotrack-tunnel"
  }
}

# --- Summary ------------------------------------------------------------------
Write-Host ""
if ($allLocalOk -and $tunnelOk) {
  Write-Host "Serveur de deploiement pret : le site Vercel et l'APK peuvent se connecter." -ForegroundColor Green
  if (-not $CheckOnly) {
    Write-Host "Laisse les fenetres des services ouvertes et empeche la mise en veille du PC pendant les tests."
  }
  exit 0
} else {
  Write-Host "Serveur de deploiement incomplet : voir les lignes [KO] ci-dessus." -ForegroundColor Red
  exit 1
}
