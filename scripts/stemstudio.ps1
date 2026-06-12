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
$candidateRoots = @()

try {
    $cmdExe = [Environment]::GetCommandLineArgs()[0]
    if ($cmdExe) {
        $candidateRoots += (Split-Path -Parent $cmdExe)
        $candidateRoots += (Split-Path -Parent (Split-Path -Parent $cmdExe))
    }
} catch {}

if ($PSScriptRoot) {
    $candidateRoots += $PSScriptRoot
    $candidateRoots += (Split-Path -Parent $PSScriptRoot)
}

try {
    $candidateRoots += (Get-Location).Path
    $candidateRoots += (Split-Path -Parent (Get-Location).Path)
} catch {}

try {
    $baseDir = [System.AppDomain]::CurrentDomain.BaseDirectory
    if ($baseDir) {
        $candidateRoots += $baseDir
        $candidateRoots += (Split-Path -Parent $baseDir)
    }
} catch {}

$root = $null
foreach ($c in ($candidateRoots | Where-Object { $_ } | Select-Object -Unique)) {
    $b = Join-Path $c 'backend'
    $f = Join-Path $c 'frontend'
    if ((Test-Path $b) -and (Test-Path $f)) {
        $root = $c
        break
    }
}

if (-not $root) {
    throw 'Project root tidak ditemukan. Pastikan file EXE dijalankan dari dalam folder project STEM Studio.'
}

$backendPath = Join-Path $root 'backend'
$frontendPath = Join-Path $root 'frontend'
$runtimePath = Join-Path $root '.stemstudio'
$logPath = Join-Path $runtimePath 'logs'
$pidPath = Join-Path $runtimePath 'pids'

if (-not (Test-Path $backendPath)) {
    throw "Backend folder not found: $backendPath"
}
if (-not (Test-Path $frontendPath)) {
    throw "Frontend folder not found: $frontendPath"
}

function Convert-ToEncodedCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    return [Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes($Command))
}

function Get-LocalIPv4 {
    $ip = Get-NetIPAddress -AddressFamily IPv4 |
        Where-Object {
            $_.IPAddress -ne '127.0.0.1' -and
            $_.PrefixOrigin -ne 'WellKnown' -and
            $_.IPAddress -notlike '169.254.*'
        } |
        Select-Object -ExpandProperty IPAddress -First 1
    return $ip
}

function Start-TerminalWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Workdir,
        [Parameter(Mandatory = $true)]
        [string]$Command
    )
    $cmdArgs = "/K cd /d `"$Workdir`" && $Command"
    Start-Process cmd.exe -ArgumentList $cmdArgs -WindowStyle Minimized
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

function Get-LogFilePath {
    param([Parameter(Mandatory = $true)][string]$Name)
    return (Join-Path $logPath "$Name.log")
}

function Get-ErrFilePath {
    param([Parameter(Mandatory = $true)][string]$Name)
    return (Join-Path $logPath "$Name.err.log")
}

function Get-RunningProcessFromPidFile {
    param([Parameter(Mandatory = $true)][string]$Name)
    $pidFile = Get-PidFilePath -Name $Name
    if (-not (Test-Path $pidFile)) { return $null }
    $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $raw) { return $null }
    $pidValue = 0
    if (-not [int]::TryParse($raw, [ref]$pidValue)) { return $null }
    return (Get-Process -Id $pidValue -ErrorAction SilentlyContinue)
}

function Stop-BackgroundService {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [int]$Port = 0
    )
    $pidFile = Get-PidFilePath -Name $Name
    if (-not (Test-Path $pidFile)) { return }
    $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidValue = 0
    if ([int]::TryParse($raw, [ref]$pidValue)) {
        $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        if ($proc) {
            taskkill /PID $pidValue /T /F | Out-Null
        }
    }
    if ($Port -gt 0) {
        try {
            $pids = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
                Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($p in $pids) {
                if ($p -and $p -ne 0) {
                    taskkill /PID $p /T /F | Out-Null
                }
            }
        } catch {}
    }
    Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue
}

function Start-BackgroundService {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [Parameter(Mandatory = $true)][string]$Workdir,
        [Parameter(Mandatory = $true)][string]$Command
    )

    $existing = Get-RunningProcessFromPidFile -Name $Name
    if ($existing) {
        if (-not $Silent) { Write-Host "$Name already running (PID: $($existing.Id))." }
        return
    }

    $logFile = Get-LogFilePath -Name $Name
    $errFile = Get-ErrFilePath -Name $Name
    $runner = @'
Set-Location -LiteralPath "__WORKDIR__"
& { __COMMAND__ }
'@.
    Replace('__WORKDIR__', $Workdir).
    Replace('__COMMAND__', $Command)

    $encodedRunner = Convert-ToEncodedCommand -Command $runner
    $proc = Start-Process -FilePath 'powershell' `
        -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-EncodedCommand', $encodedRunner) `
        -WorkingDirectory $Workdir `
        -RedirectStandardOutput $logFile `
        -RedirectStandardError $errFile `
        -WindowStyle Hidden `
        -PassThru

    (Get-PidFilePath -Name $Name) | ForEach-Object {
        Set-Content -LiteralPath $_ -Value $proc.Id
    }
    if (-not $Silent) { Write-Host "$Name started in background (PID: $($proc.Id))." }
}

function Open-AppWindow {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Url
    )

    $edgePaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )

    foreach ($edge in $edgePaths) {
        if (Test-Path $edge) {
            return (Start-Process -FilePath $edge -ArgumentList @("--app=$Url") -PassThru)
        }
    }

    $chromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe"
    )

    foreach ($chrome in $chromePaths) {
        if (Test-Path $chrome) {
            return (Start-Process -FilePath $chrome -ArgumentList @("--app=$Url") -PassThru)
        }
    }

    return (Start-Process $Url -PassThru)
}

function Wait-HttpReady {
    param(
        [Parameter(Mandatory = $true)][string]$Url,
        [int]$TimeoutSec = 45
    )
    $deadline = (Get-Date).AddSeconds($TimeoutSec)
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
            if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 500) {
                return $true
            }
        } catch {}
        Start-Sleep -Milliseconds 800
    }
    return $false
}

if ($NoNewWindow) {
    Write-Host 'Starting backend in current window...'
    $backendNoWindow = @'
Set-Location -LiteralPath "__BACKEND_PATH__"
py -3 manage.py runserver 0.0.0.0:8000
'@.Replace('__BACKEND_PATH__', $backendPath)
    $backendNoWindowEncoded = Convert-ToEncodedCommand -Command $backendNoWindow
    Start-Job -Name 'stem-backend' -ScriptBlock {
        param($encoded)
        powershell -NoExit -EncodedCommand $encoded
    } -ArgumentList $backendNoWindowEncoded | Out-Null

    Write-Host 'Starting frontend in current window...'
    $frontendNoWindow = @'
Set-Location -LiteralPath "__FRONTEND_PATH__"
npm run dev
'@.Replace('__FRONTEND_PATH__', $frontendPath)
    $frontendNoWindowEncoded = Convert-ToEncodedCommand -Command $frontendNoWindow
    Start-Job -Name 'stem-frontend' -ScriptBlock {
        param($encoded)
        powershell -NoExit -EncodedCommand $encoded
    } -ArgumentList $frontendNoWindowEncoded | Out-Null

    Write-Host 'Both jobs started. Use Get-Job and Receive-Job to inspect logs.'
} else {
    $url = 'http://localhost:3000/'
    if ($UseLocalIp) {
        $localIp = Get-LocalIPv4
        if ($localIp) {
            $url = "http://$localIp`:3000/"
        } else {
            Write-Host 'Local IP not found, fallback to localhost.'
        }
    }

    $backendCmd = 'py -3 manage.py runserver 0.0.0.0:8000'
    $frontendCmd = 'npm run dev'

    if ($Background) {
        Ensure-RuntimeDirs
        Stop-BackgroundService -Name 'backend' -Port 8000
        Stop-BackgroundService -Name 'frontend' -Port 3000
        Start-BackgroundService -Name 'backend' -Workdir $backendPath -Command "& 'C:\Windows\py.exe' -3 manage.py runserver 0.0.0.0:8000"
        Start-BackgroundService -Name 'frontend' -Workdir $frontendPath -Command "& 'C:\Program Files\nodejs\npm.cmd' run dev"
    } else {
        Start-TerminalWindow -Workdir $backendPath -Command $backendCmd

        Start-TerminalWindow -Workdir $frontendPath -Command $frontendCmd
    }

    $appProc = $null
    if (Wait-HttpReady -Url $url -TimeoutSec 45) {
        if ($OpenInBrowser) {
            if (-not $Silent) { Write-Host "Opening browser: $url" }
            $appProc = Start-Process $url -PassThru
        } else {
            if (-not $Silent) { Write-Host "Opening desktop app window: $url" }
            $appProc = Open-AppWindow -Url $url
        }
    } else {
        if (-not $Silent) { Write-Host "Aplikasi belum siap di $url. Periksa log di: $logPath" }
    }

    if ($Background) {
        if (-not $Silent) {
            Write-Host "Background mode aktif. Log: $logPath"
            Write-Host "Cek status: powershell -ExecutionPolicy Bypass -File `"$root\scripts\stemstudio-status.ps1`""
            Write-Host "Lihat log: powershell -ExecutionPolicy Bypass -File `"$root\scripts\stemstudio-logs.ps1`""
        }
        if (-not $KeepRunningAfterAppClose -and $appProc) {
            try {
                Wait-Process -Id $appProc.Id
            } catch {}
            Stop-BackgroundService -Name 'backend' -Port 8000
            Stop-BackgroundService -Name 'frontend' -Port 3000
        }
    }
}
