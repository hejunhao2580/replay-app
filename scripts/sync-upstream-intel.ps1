param(
  [string]$UpstreamUrl = "https://github.com/tryreplay/replay-app.git",
  [string]$UpstreamBranch = "main",
  [switch]$NoBuild,
  [switch]$AllowDirty
)

$ErrorActionPreference = "Stop"
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $RepoRoot

if (-not $AllowDirty) {
  $Dirty = & git status --porcelain
  if ($Dirty) {
    throw "Working tree has uncommitted changes. Commit or back them up first, or pass -AllowDirty."
  }
}

$RemoteNames = & git remote
if ($RemoteNames -notcontains "upstream") {
  & git remote add upstream $UpstreamUrl
} else {
  $CurrentUrl = (& git remote get-url upstream).Trim()
  if ($CurrentUrl -ne $UpstreamUrl) {
    Write-Host "Existing upstream detected: $CurrentUrl"
    Write-Host "Keeping the existing upstream instead of changing it to: $UpstreamUrl"
  }
}

Write-Host "Fetching upstream updates: upstream/$UpstreamBranch"
& git fetch upstream

Write-Host "Merging upstream updates. If conflicts occur, resolve them and rerun the build script."
& git merge --no-edit "upstream/$UpstreamBranch"

if (-not $NoBuild) {
  & (Join-Path $PSScriptRoot "build-intel-windows.ps1")
}
