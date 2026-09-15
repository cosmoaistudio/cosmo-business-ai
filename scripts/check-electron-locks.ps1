$hits = @()
Get-Process -ErrorAction SilentlyContinue | ForEach-Object {
  $n = $_.ProcessName
  $path = $_.Path
  # Installed store app (Program Files) does not lock this repo's release/
  if ($path -and $path -match '\\Program Files\\') { return }
  if ($n -eq "electron" -or $n -eq "app-builder" -or $n -like "Cosmo*") {
    $hits += $n
  }
}
if ($hits.Count -gt 0) {
  ($hits | Select-Object -Unique) -join ", "
}
