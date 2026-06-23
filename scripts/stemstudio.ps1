param(
    [switch]$NoNewWindow,
    [switch]$UseLocalIp,
    [switch]$OpenInBrowser,
    [switch]$Background,
    [switch]$KeepRunningAfterAppClose,
    [switch]$Silent
)

if (-not $PSBoundParameters.ContainsKey('Background')) { $Background = $false }
if (-not $PSBoundParameters.ContainsKey('Silent')) { $Silent = $true }

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $root 'backend'
$runtimePath = Join-Path $root '.stemstudio'
$logPath = Join-Path $runtimePath 'logs'
$pidPath = Join-Path $runtimePath 'pids'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found: $backendPath"
}

function Ensure-RuntimeDirs {
    foreach ($p in @($runtimePath, $logPath, $pidPath)) {
        if (-not (Test-Path $p)) {
            New-Item -ItemType Directory -Path $p | Out-Null
        }
    }
}

function Get-PidFilePath {
    param([Parameter(Mandatory = $true)][string]$Name)
    return (Join-Path $pidPath "$Name.pid")
}

function Stop-BackgroundService {
    param([Parameter(Mandatory = $true)][string]$Name, [int]$Port = 0)
    $pidFile = Get-PidFilePath -Name $Name
    if (Test-Path $pidFile) {
        $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
        $pidValue = 0
        if ([int]::TryParse($raw, [ref]$pidValue)) {
            taskkill /PID $pidValue /T /F 2>$null | Out-Null
        }
        Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
    }
    if ($Port -gt 0) {
        try {
            $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $pids) {
                if ($p -and $p -ne 0) {
                    taskkill /PID $p /T /F 2>$null | Out-Null
                }
            }
        } catch {}
    }
}

function Start-BackgroundService {
    param([Parameter(Mandatory = $true)][string]$Name, [Parameter(Mandatory = $true)][string]$Workdir)
    $logFile = Join-Path $logPath "$Name.log"
    $errFile = Join-Path $logPath "$Name.err.log"
    $command = "Set-Location -LiteralPath `"$Workdir`"; py -3 manage.py runserver 0.0.0.0:8000"
    $encoded = [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($command))
    $proc = Start-Process -FilePath 'powershell' `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encoded) `
        -WorkingDirectory $Workdir `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError $errFile `
        -WindowStyle Hidden `
        -PassThru
    Set-Content -LiteralPath (Get-PidFilePath -Name $Name) -Value $proc.Id
}

function Get-LocalIPv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object { $_.IPAddress -ne '127.0.0.1' -and $_.IPAddress -notlike '169.254.*' } |
        Select-Object -ExpandProperty IPAddress -First 1
    return $ip
}

function Wait-HttpReady {
    param([Parameter(Mandatory = $true)][string]$Url, [int]$TimeoutSec = 45)
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) { return $true }
        } catch {}
        Start-Sleep -Milliseconds 800
    }
    return $false
}

$hostName = 'localhost'
if ($UseLocalIp) {
    $localIp = Get-LocalIPv4
    if ($localIp) { $hostName = $localIp }
}
$url = "http://$hostName`:8000/admin/"
$backendCmd = 'py -3 manage.py runserver 0.0.0.0:8000'

if ($NoNewWindow) {
    Set-Location -LiteralPath $backendPath
    Invoke-Expression $backendCmd
    return
}

if ($Background) {
    Ensure-RuntimeDirs
    Stop-BackgroundService -Name 'backend' -Port 8000
    Start-BackgroundService -Name 'backend' -Workdir $backendPath
} else {
    Start-Process cmd.exe -ArgumentList "/K cd /d `"$backendPath`" && $backendCmd" -WindowStyle Minimized
}

$appProc = $null
if (Wait-HttpReady -Url $url -TimeoutSec 45) {
    if (-not $Silent) { Write-Host "Opening Django Admin: $url" }
    $appProc = Start-Process $url -PassThru
} elseif (-not $Silent) {
    Write-Host "Django Admin not ready at $url. Check logs in: $logPath"
}

if ($Background -and -not $KeepRunningAfterAppClose -and $appProc) {
    try { Wait-Process -Id $appProc.Id } catch {}
    Stop-BackgroundService -Name 'backend' -Port 8000
}
