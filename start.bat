@echo off
title Sistema de Gestao Escolar - JG Sistemas
echo ============================================
echo   Sistema de Gestao Escolar - JG Sistemas
echo ============================================
echo.

cd /d "%~dp0backend"

if not exist "venv\Scripts\activate.bat" (
    echo [ERRO] Pasta venv nao encontrada!
    echo Execute: python -m venv venv
    echo Depois: venv\Scripts\pip install -r requirements.txt
    pause
    exit /b 1
)

call venv\Scripts\activate.bat

echo Iniciando servidor na porta 8000...
echo Acesse: http://localhost:8000
echo.
echo Pressione CTRL+C para parar.
echo.

start "" http://localhost:8000
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
