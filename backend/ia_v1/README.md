# Algoritmo de Recomendação de Artistas com KNN

Este projeto implementa um sistema de recomendação de artistas musicais utilizando a técnica de filtragem colaborativa baseada em itens com o algoritmo K-Nearest Neighbors (KNN). O objetivo é sugerir novos artistas para um usuário com base nos artistas ouvidos por outros usuários com gostos musicais semelhantes.

## Visão Geral do Funcionamento

1.  **Carregamento de Dados:** O script carrega dois arquivos CSV:
    *   `user_artists.csv`: Contém as interações entre usuários e artistas (quem ouviu quem e com que frequência/peso).
    *   `artists.csv`: Contém informações sobre os artistas (ID, nome, etc.).
2.  **Pré-processamento:** Os dados são preparados para o modelo:
    *   Criação de uma **matriz esparsa usuário-artista**: Esta matriz representa as interações, onde linhas são usuários, colunas são artistas e os valores podem ser a contagem de vezes que um usuário ouviu um artista (ou 1, se apenas a interação importar). Usamos o `weight` fornecido nos dados originais.
    *   **Mapeamento de IDs:** Como os IDs originais podem não ser sequenciais, criamos mapeamentos internos para garantir que os índices da matriz sejam contínuos.
3.  **Treinamento do Modelo KNN:**
    *   Utilizamos a classe `NearestNeighbors` da biblioteca `scikit-learn`.
    *   A métrica de distância `cosine` é usada, pois é eficaz para medir a similaridade entre vetores em dados esparsos (como nossa matriz usuário-artista).
    *   O modelo aprende a encontrar os `k` usuários mais similares (vizinhos) a um determinado usuário, com base nos artistas que eles ouviram.
4.  **Geração de Recomendações:**
    *   Para um `user_id` específico, o script encontra seus vizinhos mais próximos usando o modelo KNN treinado.
    *   Ele identifica os artistas que esses vizinhos ouviram, mas que o `user_id` alvo *ainda não ouviu*.
    *   Um score de recomendação é calculado para cada artista candidato, geralmente baseado na similaridade dos vizinhos que ouviram aquele artista e no `weight` original da interação.
    *   Os artistas com os maiores scores são retornados como recomendações.

## Pré-requisitos

Antes de começar, certifique-se de ter o Python 3 instalado em seu sistema. Você também precisará do `pip`, o gerenciador de pacotes do Python.

*   **Python 3:** Você pode baixar em [python.org](https://www.python.org/downloads/).
*   **pip:** Geralmente vem instalado com o Python 3. Você pode verificar executando `python3 -m pip --version` no seu terminal.

## Instalação das Dependências

Este projeto utiliza algumas bibliotecas Python que precisam ser instaladas. Abra seu terminal ou prompt de comando e execute o seguinte comando:

```bash
pip3 install pandas numpy scikit-learn
```

*   **pandas:** Para manipulação e análise de dados (leitura dos CSVs, etc.).
*   **numpy:** Para operações numéricas eficientes, especialmente com arrays.
*   **scikit-learn:** A biblioteca principal de machine learning que usamos para o KNN (`NearestNeighbors`).

## Estrutura do Projeto

Certifique-se de que os seguintes arquivos estejam na estrutura correta:

```
artist_recommendation/
├── data/
│   ├── artists.csv       # Arquivo com informações dos artistas
│   └── user_artists.csv  # Arquivo com interações usuário-artista
├── recommendation_knn.py # O script principal do algoritmo
└── README.md             # Este arquivo de instruções
```

**Importante:** Os arquivos `artists.csv` e `user_artists.csv` devem estar dentro da pasta `data`. O script `recommendation_knn.py` espera encontrá-los nesse local.

## Como Executar o Algoritmo

1.  **Navegue até o diretório do projeto:** Abra seu terminal e use o comando `cd` para entrar na pasta `artist_recommendation`.

    ```bash
    cd caminho/para/artist_recommendation
    ```

2.  **Execute o script Python:**

    ```bash
    python3.11 recommendation_knn.py
    ```
    *(Use `python` ou `python3` dependendo de como o Python está configurado no seu sistema)*

## Entendendo a Saída

Ao executar o script, você verá algumas mensagens no console indicando o progresso:

*   Carregamento dos dados.
*   Criação da matriz usuário-artista (mostrando o tamanho da matriz).
*   Treinamento do modelo KNN.
*   Geração de recomendações para um usuário de teste (por padrão, `userID = 2`).

No final, se tudo ocorrer bem, você verá uma lista formatada das recomendações para o usuário de teste, algo como:

```
--- Top 15 Recomendações para Usuário 2 ---
 artistID             name  estimated_score
      107        Sopor Aeternus & The Ensemble of Shadows      2515.987305
       89           Lady Gaga      2360.537109
      289           Britney Spears      2209.013916
      ... (mais artistas)

Tempo total de execução: XX.XX segundos
```

*   `artistID`: O ID único do artista recomendado.
*   `name`: O nome do artista.
*   `estimated_score`: Uma pontuação calculada que indica a força da recomendação (quanto maior, melhor). Baseia-se na similaridade dos vizinhos e no peso das interações deles com o artista.

## Testando com Outros Usuários

O script está configurado para testar com `userID = 2` por padrão. Para gerar recomendações para um usuário diferente:

1.  **Abra o arquivo `recommendation_knn.py`** em um editor de texto ou IDE.
2.  **Encontre a linha** (próximo ao final do arquivo, dentro do bloco `if __name__ == '__main__':`):

    ```python
    test_user_id = 2
    ```

3.  **Altere o número `2`** para o `userID` do usuário que você deseja testar.
    *   **Importante:** Certifique-se de que o `userID` escolhido exista no arquivo `user_artists.csv`.
4.  **Salve o arquivo**.
5.  **Execute o script novamente** como explicado na seção "Como Executar o Algoritmo".

A saída agora mostrará as recomendações para o novo `userID` que você especificou.

## Próximos Passos: Integração com API e Armazenamento

Você mencionou que planeja integrar este algoritmo a uma API Node.js e um aplicativo. Aqui estão algumas orientações:

1.  **Como a API usará o Modelo:**
    *   **Opção 1: Executar o Script Python sob Demanda:** Sua API Node.js pode chamar o script `recommendation_knn.py` como um processo filho sempre que precisar de recomendações. Isso é mais simples de implementar inicialmente, mas pode ser lento se muitas requisições chegarem, pois o modelo KNN precisaria ser carregado e treinado (ou pelo menos carregado, se você salvar o modelo treinado) a cada chamada.
    *   **Opção 2: Criar um Serviço Python Separado (Recomendado):** Você pode transformar o script Python em um pequeno serviço web (usando Flask ou FastAPI) que mantém o modelo KNN carregado na memória. Sua API Node.js faria requisições HTTP para este serviço Python para obter as recomendações. Isso é mais eficiente para múltiplas requisições.
    *   **Opção 3: Reescrever em Node.js (Complexo):** Reescrever a lógica KNN e manipulação de matrizes em Node.js é possível com bibliotecas como `node-kdtree` ou outras, mas geralmente é mais complexo e pode não ter o mesmo desempenho ou facilidade das bibliotecas Python especializadas como Scikit-learn.

2.  **Armazenamento de Dados:**
    *   **Dados de Interação (`user_artists.csv`):** Para uma aplicação real, manter isso em um arquivo CSV não é ideal. Você deve armazenar essas interações em um **banco de dados** (SQL como PostgreSQL/MySQL, ou NoSQL como MongoDB).
        *   Sua API Node.js seria responsável por ler/escrever essas interações no banco de dados.
        *   O script/serviço Python precisaria buscar esses dados do banco de dados para treinar/atualizar o modelo KNN.
    *   **Dados dos Artistas (`artists.csv`):** Similarmente, armazene as informações dos artistas em uma tabela/coleção no seu banco de dados.
    *   **Modelo KNN Treinado:** Para evitar retreinar o modelo a cada requisição (Opção 1) ou a cada reinicialização do serviço (Opção 2), você pode **salvar o modelo treinado** em um arquivo. A biblioteca `joblib` (parte do ecossistema Scikit-learn) é comumente usada para isso.
        ```python
        import joblib
        # ... (depois de treinar o knn_model)
        joblib.dump(knn_model, 'knn_model.joblib') 
        # Para carregar:
        # knn_model = joblib.load('knn_model.joblib')
        ```
        Você também precisaria salvar os mapeamentos (`user_id_map`, `artist_id_map`) junto com o modelo.

3.  **Fluxo de Integração (Exemplo com Serviço Python):**
    *   Usuário interage com o aplicativo (React Native, etc.), informando artistas favoritos.
    *   Aplicativo envia os dados para a API Node.js.
    *   API Node.js salva as novas interações no Banco de Dados.
    *   API Node.js faz uma requisição HTTP para o Serviço Python de Recomendação, passando o `userID`.
    *   Serviço Python:
        *   Carrega o modelo KNN e mapeamentos (se ainda não estiverem na memória).
        *   Busca os dados *mais recentes* do usuário no Banco de Dados (ou usa a matriz já carregada se o modelo for treinado periodicamente).
        *   Gera as recomendações usando o `recommend_artists`.
        *   Retorna a lista de `artistID`s recomendados para a API Node.js.
    *   API Node.js busca os detalhes (nome, imagem) dos artistas recomendados no Banco de Dados.
    *   API Node.js retorna a lista completa de recomendações para o aplicativo.
    *   Aplicativo exibe as recomendações.

4.  **Atualização do Modelo:** O modelo KNN precisa ser retreinado periodicamente (ex: diariamente, semanalmente) à medida que novas interações de usuários são adicionadas ao banco de dados, para que as recomendações permaneçam relevantes.

Lembre-se que esta é uma visão geral. A implementação exata dependerá das suas escolhas de tecnologia e arquitetura.

