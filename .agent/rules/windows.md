---
trigger: always_on
---

Lições Aprendidas (Windows/PWSH & Stack):
Rede: reusePort: true em httpServer.listen() causa ENOTSUP no Windows. Remova ou use condicional.

PostgreSQL:

Locais costumam falhar com SSL: use PGSSLMODE=disable.

Binários ficam em C:\Program Files\PostgreSQL\<versão>\bin.

Para localizar: Get-ChildItem -Path "C:\Program Files\PostgreSQL" -Filter "psql.exe" -Recurse.

Processos: Para liberar porta (ex: 5000) ocupada: Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

Variáveis: Use $env:VAR='valor'; comando ou npx dotenv -e .env -- comando.

React / Frontend (Crítico):

Proibido: Definir componentes dentro de outros componentes (causa perda de foco/input lag).

Correção: Extraia formulários e sub-componentes para o escopo global ou novos arquivos.

Validação:

Sempre execute npm run check (TypeScript) e npm run build antes de solicitar o commit.
