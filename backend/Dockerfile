# Dockerfile para Aplicação Node.js + Python (Recomendador de Artistas) - v2 (com venv)

# 1. Estágio Base: Instalar Node.js e Python
FROM node:18-slim as base

WORKDIR /app

# Instalar Python, Pip, venv e dependências de sistema
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-venv python3-dev build-essential libpq-dev && \
    rm -rf /var/lib/apt/lists/*

# Criar um ambiente virtual Python
RUN python3 -m venv /opt/venv
# Adicionar o venv ao PATH para que os comandos python e pip usem o venv por padrão
ENV PATH="/opt/venv/bin:$PATH"

# 2. Estágio de Build Node.js: Instalar dependências npm
COPY api/package.json api/package-lock.json* ./api/
WORKDIR /app/api
RUN npm install --omit=dev

# 3. Estágio de Build Python: Instalar dependências pip DENTRO DO VENV
WORKDIR /app
COPY requirements.txt ./
# Ativar o venv não é necessário aqui porque já está no PATH
# Instalar as dependências Python usando o pip do venv
RUN pip install --no-cache-dir -r requirements.txt

# 4. Estágio Final: Copiar código da aplicação e definir comando de execução
WORKDIR /app
COPY . .

# Expor a porta da API Node.js
EXPOSE 3000

# Comando padrão para iniciar a aplicação Node.js
# O comando 'python3' agora usará o python do venv por causa do ENV PATH
CMD [ "node", "api/app.js" ]

