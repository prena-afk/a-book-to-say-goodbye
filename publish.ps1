# Publish this book to GitHub
# Run after: gh auth login

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$gh = "C:\Program Files\GitHub CLI\gh.exe"
if (-not (Test-Path $gh)) {
    $gh = "gh"
}

& $gh auth status
if ($LASTEXITCODE -ne 0) {
    Write-Host "Please log in first: gh auth login"
    exit 1
}

$repoName = "a-book-to-say-goodbye"
$exists = & $gh repo view $repoName 2>$null
if ($LASTEXITCODE -ne 0) {
    & $gh repo create $repoName `
        --public `
        --source=. `
        --remote=origin `
        --description "A Book to Say Goodbye by Prena Dhomwja" `
        --push
} else {
    git push -u origin main
}

Write-Host ""
Write-Host "Done. Open your repo with:"
& $gh repo view $repoName --web
