$ContainerName = "bus-ticket-db" # Container name (in docker-compose.yml)
$DBUser = "postgres"
$DBName = "bus_ticket_dev" # DB name (in docker-compose.yml)
$SqlFile = "server/src/models/init.sql"

Write-Host "Dang khoi tao database tu file $SqlFile..." -ForegroundColor Cyan

# Kiểm tra file tồn tại
if (-Not (Test-Path $SqlFile)) {
    Write-Error "Khong tim thay file SQL tai: $SqlFile"
    exit 1
}

try {
    Get-Content $SqlFile | docker exec -i $ContainerName psql -U $DBUser -d $DBName
    Write-Host "✅ Khoi tao Database thanh cong!" -ForegroundColor Green
}
catch {
    Write-Error "❌ Loi khi chay script: $_"
}