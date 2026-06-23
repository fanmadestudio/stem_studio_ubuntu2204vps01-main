param(
    [ValidateSet('all', 'backend')]
    [string]$Target = 'all'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $root '.stemstudio\pids'

function Stop-ServiceByPidFile {
    param(
        [Parameter(Mandatory = $true)][string]$Name,
        [int]$Port = 0
    )
    $pidFile = Join-Path $pidPath "$Name.pid"
    if (-not (Test-Path $pidFile)) {
        Write-Host "$Name sudah stop."
        return
    }

    $raw = Get-Content -LiteralPath $pidFile -ErrorAction SilentlyContinue | Select-Object -First 1
    $pidValue = 0
    if ([int]::TryParse($raw, [ref]$pidValue)) {
        $proc = Get-Process -Id $pidValue -ErrorAction SilentlyContinue
        if ($proc) {
            taskkill /PID $pidValue /T /F | Out-Null
            Write-Host "$Name stopped (PID: $pidValue)."
        } else {
            Write-Host "$Name tidak berjalan (PID lama: $pidValue)."
        }
    } else {
        Write-Host "$Name pid tidak valid."
    }

    Remove-Item -LiteralPath $pidFile -ErrorAction SilentlyContinue

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
}

if ($Target -eq 'all' -or $Target -eq 'backend') {
    Stop-ServiceByPidFile -Name 'backend' -Port 8000
}
