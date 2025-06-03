# Tutorial de Integração: API Node.js + Recomendador Python + PostgreSQL

Este tutorial detalha como integrar o sistema de recomendação de artistas (Python/KNN) com uma API Node.js e um banco de dados PostgreSQL, utilizando o modelo pré-treinado salvo com `joblib`.

## Visão Geral da Arquitetura

1.  **Banco de Dados (PostgreSQL):** Armazena os dados dos artistas (`artists`) e as interações dos usuários com os artistas (`user_artists`, incluindo `userID`, `artistID`, `weight`).
2.  **Script de Treinamento (Python - `train_and_save_model.py`):**
    *   Conecta-se ao PostgreSQL.
    *   Lê os dados de `user_artists`.
    *   Treina o modelo KNN.
    *   Salva o modelo treinado, a matriz de interações e os mapeamentos de ID em arquivos `.joblib`.
    *   **Deve ser executado periodicamente** (ex: uma vez por dia/semana) para atualizar o modelo com novos dados.
3.  **Script de Recomendação Rápida (Python - `recommend_from_saved.py`):**
    *   Carrega os arquivos `.joblib` (modelo, matriz, mapas).
    *   Recebe um `userID` e `n` (número de recomendações) como argumentos.
    *   Calcula e retorna as recomendações em formato JSON.
    *   **É chamado pela API Node.js sob demanda.**
4.  **API (Node.js):**
    *   Gerencia as rotas (ex: `/users/:userId/recommendations`).
    *   Recebe requisições HTTP.
    *   Chama o script `recommend_from_saved.py` passando o `userID`.
    *   Recebe o JSON com os `artistID`s recomendados.
    *   (Opcional/Recomendado) Busca os detalhes dos artistas (nome, etc.) no PostgreSQL usando os `artistID`s recebidos.
    *   Retorna a resposta completa para o cliente (aplicativo).
    *   **Responsável por salvar novas interações** (quando um usuário informa seus artistas favoritos) no PostgreSQL, **utilizando o `weight` definido.**

## Pré-requisitos

*   **PostgreSQL:** Servidor instalado e rodando, com um banco de dados criado e as tabelas `artists` e `user_artists` populadas.
*   **Python 3:** Instalado, com `pip`.
*   **Node.js:** Instalado, com `npm` ou `yarn`.
*   **Dependências Python:** Instaladas (`pandas`, `numpy`, `scikit-learn`, `psycopg2-binary`, `joblib`). Se não instalou, rode:
    ```bash
    pip3 install pandas numpy scikit-learn psycopg2-binary joblib
    ```

## Passo 1: Treinar e Salvar o Modelo Inicial

1.  **Configure a Conexão com o Banco:**
    *   Abra o arquivo `train_and_save_model.py`.
    *   Localize a seção `DB_CONFIG`.
    *   **Substitua os valores** `"seu_banco_de_dados"`, `"seu_usuario"`, `"sua_senha"`, `"localhost"`, `"5432"` pelos dados corretos da sua conexão PostgreSQL.

2.  **Execute o Script de Treinamento:**
    *   Navegue até a pasta `artist_recommendation` no seu terminal.
    *   Execute o comando:
        ```bash
        python3.11 train_and_save_model.py 
        ```
        *(Use `python` ou `python3` conforme sua configuração)*
    *   Aguarde a execução. Ele vai se conectar ao banco, carregar os dados, treinar o modelo e salvar os seguintes arquivos no mesmo diretório (ou no `MODEL_DIR` configurado):
        *   `knn_model.joblib`
        *   `user_item_matrix.joblib`
        *   `user_id_map.joblib`
        *   `artist_id_map.joblib`
        *   `index_artist_map.joblib`

    *   **Verifique se esses arquivos foram criados.** Se ocorrerem erros, verifique as mensagens no console (problemas de conexão, nomes de tabelas/colunas incorretos, etc.).

## Passo 2: Configurar o Exemplo Node.js

1.  **Estrutura de Pastas:** Certifique-se de que a pasta `nodejs_integration_example` esteja dentro da pasta `artist_recommendation`, ou ajuste os caminhos nos arquivos Node.js.
A estrutura esperada é:
    ```
    artist_recommendation/
    ├── data/                 # (Opcional agora, usamos DB)
    ├── nodejs_integration_example/
    │   ├── src/
    │   │   ├── controllers/
    │   │   │   └── recommendationController.js
    │   │   └── services/
    │   │       └── recommendationService.js
    │   └── (outros arquivos node: package.json, server.js, etc. - NÃO FORNECIDOS AQUI)
    ├── train_and_save_model.py
    ├── recommend_from_saved.py
    ├── knn_model.joblib        # (Gerado no Passo 1)
    ├── user_item_matrix.joblib # (Gerado no Passo 1)
    ├── user_id_map.joblib      # (Gerado no Passo 1)
    ├── artist_id_map.joblib    # (Gerado no Passo 1)
    ├── index_artist_map.joblib # (Gerado no Passo 1)
    └── README_integration.md   # Este arquivo
    ```

2.  **Verifique os Caminhos:**
    *   Abra `nodejs_integration_example/src/services/recommendationService.js`.
    *   Confirme se `PYTHON_EXECUTABLE` está correto para o seu sistema (`python3.11`, `python3`, `python`).
    *   Confirme se `PYTHON_SCRIPT_PATH` aponta corretamente para o arquivo `recommend_from_saved.py` (o caminho relativo `path.join(__dirname, "..", "..", "..", "recommend_from_saved.py")` deve funcionar com a estrutura acima).

3.  **Crie sua API Node.js (Exemplo Básico):**
    *   Você precisará de um arquivo principal para sua API (ex: `server.js` ou `app.js`) que use um framework como Express para definir as rotas e iniciar o servidor.
    *   **Exemplo mínimo usando Express (instale com `npm install express`):**

        ```javascript
        // nodejs_integration_example/server.js 
        const express = require("express");
        const recommendationController = require("./src/controllers/recommendationController");

        const app = express();
        const port = 3000; // Ou a porta que preferir

        app.use(express.json()); // Para parsear body de requisições JSON

        // Define a rota para recomendações
        // Ex: GET http://localhost:3000/users/2/recommendations?n=5
        app.get("/users/:userId/recommendations", recommendationController.getUserRecommendations);

        // --- Outras Rotas (Você precisará implementá-las) ---

        // Rota para buscar artistas (para o formulário)
        app.get("/artists", (req, res) => {
            // TODO: Implementar lógica para buscar artistas do seu DB PostgreSQL
            console.log("[API] Rota GET /artists chamada - Implementação pendente");
            res.status(501).json({ message: "Rota GET /artists não implementada." });
        });

        // Rota para criar usuário e salvar preferências iniciais
        app.post("/users", (req, res) => {
            const { name, username, favoriteArtistIds } = req.body;
            // TODO: Implementar lógica para:
            // 1. Salvar o novo usuário no DB
            // 2. Para cada artistId em favoriteArtistIds:
            //    - Salvar na tabela user_artists (userID, artistId, weight)
            //    - USAR O WEIGHT DEFINIDO ABAIXO!
            console.log("[API] Rota POST /users chamada - Implementação pendente", { name, username, favoriteArtistIds });
            res.status(501).json({ message: "Rota POST /users não implementada." });
        });
        
        // Rota para adicionar/atualizar preferências de um usuário existente
        app.post("/user_artist", (req, res) => {
            const { userId, artistId } = req.body;
            // TODO: Implementar lógica para:
            // 1. Salvar/atualizar na tabela user_artists (userID, artistId, weight)
            // 2. USAR O WEIGHT DEFINIDO ABAIXO!
            console.log("[API] Rota POST /user_artist chamada - Implementação pendente", { userId, artistId });
             res.status(501).json({ message: "Rota POST /user_artist não implementada." });
        });


        app.listen(port, () => {
            console.log(`Servidor Node.js rodando em http://localhost:${port}`);
        });
        ```

## Passo 3: Definindo o `weight` para Novos Usuários

Quando um novo usuário informa seus artistas favoritos (ex: no cadastro ou em um formulário posterior), você precisa salvar essas interações na tabela `user_artists` do seu banco PostgreSQL. A coluna `weight` representa a força dessa preferência.

*   **Por que precisamos de um `weight`?** O modelo KNN usa o `weight` para entender a intensidade do gosto do usuário. Um `weight` maior indica um gosto mais forte, o que influencia mais as recomendações.
*   **Qual valor usar?** Como os novos usuários estão apenas *informando* seus favoritos (e não temos um histórico de quantas vezes eles ouviram), precisamos definir um valor padrão razoável.
*   **Análise:** Executamos o script `calculate_weight_stats.py` nos dados originais e descobrimos que a **mediana** do `weight` é **260**.
    *   A mediana é um bom ponto de partida porque é menos sensível a valores extremos (usuários que ouviram um artista milhares de vezes) do que a média.

*   **Recomendação:**
    **Use `weight = 260`** ao salvar as preferências iniciais de um novo usuário na tabela `user_artists`.

*   **Onde implementar isso no Node.js?**
    *   Na lógica da sua rota `POST /users` (ou onde quer que você salve as preferências iniciais).
    *   Quando você for inserir um registro na tabela `user_artists` para um novo usuário e um de seus artistas favoritos, use o valor `260` para a coluna `weight`.
    *   Exemplo (conceitual, usando um ORM como Sequelize ou um cliente como `pg`):
        ```javascript
        // Dentro da lógica da rota POST /users ou POST /user_artist
        const newUserId = /* ... ID do usuário recém-criado ou existente ... */ ;
        const favoriteArtistId = /* ... ID do artista favorito ... */ ;
        const defaultWeight = 260; 

        // Exemplo com SQL puro (adapte para seu cliente DB)
        const query = 'INSERT INTO user_artists ("userID", "artistID", weight) VALUES ($1, $2, $3)';
        const values = [newUserId, favoriteArtistId, defaultWeight];
        // Execute a query...
        ```

## Passo 4: Testando a Integração

1.  **Inicie sua API Node.js:**
    *   No terminal, dentro da pasta `nodejs_integration_example`.
    *   Execute `node server.js` (ou como você inicia seu servidor).
    *   Verifique se ele inicia sem erros e escuta na porta definida (ex: 3000).

2.  **Faça uma Requisição de Recomendação:**
    *   Use uma ferramenta como `curl`, Postman, Insomnia ou seu navegador.
    *   Faça uma requisição GET para a rota de recomendações, substituindo `:userId` por um ID de usuário que **exista no seu banco de dados E, consequentemente, no arquivo `user_id_map.joblib`**.
    *   Exemplo usando `curl` para o usuário com ID `2`, pedindo 5 recomendações:
        ```bash
        curl http://localhost:3000/users/2/recommendations?n=5 
        ```
    *   Exemplo para o usuário `1890` (outro ID presente nos dados originais), pedindo 10 recomendações (padrão):
        ```bash
        curl http://localhost:3000/users/1890/recommendations
        ```

3.  **Verifique a Resposta:**
    *   Você deve receber uma resposta JSON contendo uma lista de objetos, cada um com `artistID` e `score`.
        ```json
        [
          {
            "artistID": 107,
            "score": 2515.9873046875 
          },
          {
            "artistID": 89,
            "score": 2360.537109375
          },
          // ... mais recomendações
        ]
        ```
    *   Verifique os logs no console do Node.js e do Python (se houver erros) para depuração.

4.  **Teste com Usuário Inválido:**
    *   Tente fazer uma requisição para um `userID` que você sabe que não existe (ex: 999999).
        ```bash
        curl http://localhost:3000/users/999999/recommendations
        ```
    *   Você deve receber uma lista JSON vazia `[]` como resposta (pois o script Python não encontrará o usuário no mapa carregado).

## Passo 5: Retreinamento Periódico

Lembre-se que, à medida que novos usuários se cadastram e novas interações são salvas no seu banco de dados PostgreSQL (com `weight = 260` para as iniciais), o modelo salvo (`.joblib`) ficará desatualizado.

*   **Agende a execução do script `train_and_save_model.py` periodicamente.** A frequência depende do volume de novos dados (pode ser diária, semanal ou mensal).
*   Ferramentas como `cron` (Linux/macOS) ou Agendador de Tarefas (Windows) podem ser usadas para automatizar isso.
*   Cada vez que o script rodar, ele vai:
    1.  Ler os dados *mais recentes* do PostgreSQL.
    2.  Treinar um *novo* modelo KNN.
    3.  *Sobrescrever* os arquivos `.joblib` existentes.
*   O script `recommend_from_saved.py` (chamado pelo Node.js) automaticamente usará os arquivos `.joblib` mais recentes na próxima vez que for chamado, sem precisar reiniciar a API Node.js.

Pronto! Seguindo estes passos, você terá integrado seu sistema de recomendação Python com sua API Node.js e banco de dados PostgreSQL.
