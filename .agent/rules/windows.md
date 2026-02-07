---
trigger: always_on
---

estamos no pwsh (Powershell)
Use apenas comandos compatíveis

## Lições Aprendidas (Windows/PWSH):

1.  **Rede**: `reusePort: true` em `httpServer.listen()` causa `ENOTSUP` no Windows. Remova ou use condicional.
2.  **PostgreSQL**:
    - Locais costumam falhar com SSL: use `PGSSLMODE=disable`.
    - Binários ficam em `C:\Program Files\PostgreSQL\<versão>\bin`.
    - Para localizar: `Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "psql.exe" -Recurse`.
3.  **Processos**: Para liberar porta (ex: 5000) ocupada:
    `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force`
4.  **Variáveis**: Use `$env:VAR='valor'; comando` ou `npx dotenv -e .env -- comando`.
