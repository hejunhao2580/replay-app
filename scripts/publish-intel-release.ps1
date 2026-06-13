param(
  [string]$Repository = "hejunhao2580/replay-app",
  [string]$Branch = "main",
  [string]$ZipPath = "..\..\outputs\Replay-Intel-GPU-win-x64.zip",
  [string]$Tag = ""
)

$ErrorActionPreference = "Stop"

function Get-GitHubTokenFromCredentialManager {
  $query = "protocol=https`nhost=github.com`n`n"
  $credential = $query | git credential fill
  $passwordLine = $credential | Where-Object { $_ -like "password=*" } | Select-Object -First 1

  if (-not $passwordLine) {
    Write-Host "No GitHub credential found. Opening browser login..."
    git credential-manager github login
    $credential = $query | git credential fill
    $passwordLine = $credential | Where-Object { $_ -like "password=*" } | Select-Object -First 1
  }

  if (-not $passwordLine) {
    throw "GitHub login failed or no credential was stored."
  }

  return $passwordLine.Substring("password=".Length)
}

function Invoke-GitHubJson {
  param(
    [string]$Method,
    [string]$Uri,
    [object]$Body = $null,
    [string]$Token
  )

  $headers = @{
    Authorization = "Bearer $Token"
    Accept = "application/vnd.github+json"
    "X-GitHub-Api-Version" = "2022-11-28"
    "User-Agent" = "Replay-Intel-GPU-Publisher"
  }

  if ($null -eq $Body) {
    return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -TimeoutSec 120
  }

  return Invoke-RestMethod -Method $Method -Uri $Uri -Headers $headers -ContentType "application/json" -Body ($Body | ConvertTo-Json -Depth 8) -TimeoutSec 120
}

$zip = Resolve-Path -LiteralPath $ZipPath
$hash = (Get-FileHash -LiteralPath $zip -Algorithm SHA256).Hash

if (-not $Tag) {
  $Tag = "intel-gpu-win-x64-" + (Get-Date -Format "yyyyMMdd-HHmm")
}

$token = Get-GitHubTokenFromCredentialManager

git push origin HEAD:$Branch
git push origin codex/intel-gpu-xpu-openvino-cn

$releaseBody = @{
  tag_name = $Tag
  target_commitish = $Branch
  name = "Replay Intel GPU Windows $Tag"
  body = @"
Replay Intel GPU Windows build

- Intel GPU/XPU inference path.
- OpenVINO GPU provider for supported ONNX/UVR work.
- Chinese/English UI switching.
- Verified with Intel(R) Arc(TM) B580 Graphics.
- SHA256: $hash
"@
  draft = $false
  prerelease = $true
}

$release = Invoke-GitHubJson -Method "Post" -Uri "https://api.github.com/repos/$Repository/releases" -Body $releaseBody -Token $token
$uploadUrl = $release.upload_url -replace "\{\?name,label\}", "?name=Replay-Intel-GPU-win-x64.zip"

$headers = @(
  "-H", "Authorization: Bearer $token",
  "-H", "Accept: application/vnd.github+json",
  "-H", "X-GitHub-Api-Version: 2022-11-28",
  "-H", "Content-Type: application/zip"
)

& curl.exe -L -X POST @headers --data-binary "@$zip" $uploadUrl | Out-Null

Write-Host "Published release: $($release.html_url)"
Write-Host "Uploaded asset: $zip"
Write-Host "SHA256: $hash"
