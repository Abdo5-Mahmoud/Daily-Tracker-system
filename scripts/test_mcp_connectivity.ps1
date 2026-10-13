param(
    [Parameter(Mandatory = $true)]
    [string]$ConfigPath,
    [string]$UrlProperty = "serverUrl"
)

if (-not (Test-Path $ConfigPath)) {
    throw "Config file not found: $ConfigPath"
}

$json = Get-Content $ConfigPath -Raw | ConvertFrom-Json
if (-not $json.mcpServers.github) {
    throw "Missing github entry in $ConfigPath"
}

$url = $json.mcpServers.github.$UrlProperty
if ($url -ne "https://api.githubcopilot.com/mcp/") {
    throw "Invalid URL: $url in $ConfigPath (expected https://api.githubcopilot.com/mcp/)"
}

$rawOutput = (curl.exe -sI $url) -join "`n"
if ($rawOutput -notmatch "HTTP/1.1 (200|401|404|302|400)") {
    throw "Failed to reach endpoint $url. Output: $rawOutput"
}

Write-Host "PASS: $ConfigPath correctly configured with $url"
