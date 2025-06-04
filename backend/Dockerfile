# Dockerfile para Aplicação Node.js + Python (Recomendador de Artistas)

# 1. Estágio Base: Instalar Node.js e Python
# Usar uma imagem oficial do Node.js (versão LTS ou a que você usa localmente)
FROM node:18-slim as base

# Definir o diretório de trabalho
WORKDIR /app

# Instalar Python, Pip e dependências de sistema necessárias para psycopg2
# - python3-dev e build-essential são para compilar algumas dependências C
# - libpq-dev é a biblioteca cliente do PostgreSQL necessária para psycopg2
# Usar --no-install-recommends para manter a imagem menor
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip python3-dev build-essential libpq-dev && \
    # Limpar cache do apt para reduzir o tamanho da imagem
    rm -rf /var/lib/apt/lists/*

# 2. Estágio de Build Node.js: Instalar dependências npm
# Copiar apenas os arquivos de definição de pacote primeiro para aproveitar o cache do Docker
COPY api/package.json api/package-lock.json* ./api/

# Definir o diretório de trabalho para a API
WORKDIR /app/api

# Instalar apenas as dependências de produção
RUN npm install --omit=dev

# 3. Estágio de Build Python: Instalar dependências pip
# Voltar para o diretório raiz do app
WORKDIR /app

# Copiar o arquivo de requirements
COPY requirements.txt ./

# Instalar as dependências Python
# Usar --no-cache-dir para reduzir o tamanho da imagem
RUN pip3 install --no-cache-dir -r requirements.txt

# 4. Estágio Final: Copiar código da aplicação e definir comando de execução
# Voltar para o diretório raiz do app
WORKDIR /app

# Copiar todo o código da aplicação (incluindo a pasta api, scripts python, etc.)
# Certifique-se que o .dockerignore (se existir) exclui node_modules, .git, etc.
COPY . .

# Expor a porta que a API Node.js vai escutar (definida em api/app.js ou server.js)
# Assumindo que é a porta 3000, ajuste se for diferente
EXPOSE 3000

# Comando padrão para iniciar a aplicação Node.js quando o container iniciar
# Ajuste o caminho para o seu arquivo principal da API se for diferente de api/app.js
CMD [ "node", "api/app.js" ]

