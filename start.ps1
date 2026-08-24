Write-Host "=== Iniciando Sistema de Gestao ===" -ForegroundColor Green
Write-Host ""

Write-Host "Iniciando Backend (127.0.0.1:8000)..." -ForegroundColor Yellow
$backend = Start-Process -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000" -WorkingDirectory "$PSScriptRoot\backend" -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host "Iniciando Frontend (127.0.0.1:5173)..." -ForegroundColor Yellow
$frontend = Start-Process -FilePath "npx" -ArgumentList "vite --host 127.0.0.1" -WorkingDirectory "$PSScriptRoot\frontend" -PassThru -WindowStyle Minimized

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "=== Sistema rodando! ===" -ForegroundColor Green
Write-Host "Frontend:  http://localhost:5173"
Write-Host "Backend:   http://localhost:8000/docs"
Write-Host ""

# Bootstrap do admin somente no primeiro run (senha aleatoria, exibida uma vez)
Start-Sleep -Seconds 2
try {
    $adminPass = -join ((48..57) + (65..90) + (97..122) | Get-Random -Count 14 | ForEach-Object { [char]$_ })
    $body = @{ name = "Admin"; email = "admin@escola.com"; password = $adminPass; role = "admin" } | ConvertTo-Json
    $resp = Invoke-RestMethod -Uri "http://localhost:8000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
    Write-Host "Usuario admin criado com sucesso!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Login: admin@escola.com / $adminPass" -ForegroundColor Cyan
    Write-Host "(Anote esta senha. Ela sera exibida apenas desta vez.)" -ForegroundColor Gray
} catch {
    Write-Host "Usuario admin ja existe. Use as credenciais configuradas." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Pressione CTRL+C para parar os servidores" -ForegroundColor Gray
Wait-Process -Id $backend.Id, $frontend.Id
