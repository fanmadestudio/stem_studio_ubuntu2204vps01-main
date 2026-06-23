$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $root '.stemstudio\pids'

function Get-ServiceState {
    param([Parameter(Mandatory = $true)][string]$Name)
    $pidFile = Join-Path $pidPath "$Name.pid"
    if (-not (Test-Path $pidFile)) {
        return "${Name}: STOPPED (pid file tidak ada)"
    }

    $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    if (-not $raw) {
        return "${Name}: STOPPED (pid kosong)"
    }

    $pidValue = 0
    if (-not [int]::TryParse($raw, [ref]$pidValue)) {
        return "${Name}: STOPPED (pid invalid: $raw)"
    }

    $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
    if ($proc) {
        return "${Name}: RUNNING (PID: $pidValue)"
    }
    return "${Name}: STOPPED (PID lama: $pidValue)"
}

Write-Host (Get-ServiceState -Name 'backend')
