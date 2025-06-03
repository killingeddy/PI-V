# -*- coding: utf-8 -*-
"""
Algoritmo de Recomendação de Artistas usando K-Nearest Neighbors (KNN)

Este script implementa um sistema de recomendação de artistas baseado na 
técnica de filtragem colaborativa item-item usando o algoritmo KNN.
Ele encontra usuários com gostos musicais similares (vizinhos mais próximos)
e recomenda artistas que esses vizinhos ouviram, mas o usuário alvo ainda não.
"""

import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
import time

# --- 1. Carregamento e Preparação dos Dados ---
def load_data(user_artists_path=".", artists_path="."):
    """Carrega os datasets de usuários-artistas e artistas.

    Args:
        user_artists_path (str): Caminho para o arquivo user_artists.csv.
        artists_path (str): Caminho para o arquivo artists.csv.

    Returns:
        tuple: Contendo:
            - pd.DataFrame: DataFrame user_artists.
            - pd.DataFrame: DataFrame artists.
    """
    print("Carregando dados...")
    try:
        user_artists = pd.read_csv(user_artists_path, encoding='utf-8')
        # Lidando com possíveis nomes de colunas com espaços ou caracteres especiais
        user_artists.columns = [col.strip().replace(' ', '_') for col in user_artists.columns]
        print(f"Colunas em user_artists: {user_artists.columns.tolist()}")
        # Verifica se as colunas esperadas existem
        if not all(col in user_artists.columns for col in ['userID', 'artistID', 'weight']):
            raise ValueError("Colunas esperadas (userID, artistID, weight) não encontradas em user_artists.csv")

    except FileNotFoundError:
        print(f"Erro: Arquivo não encontrado em {user_artists_path}")
        return None, None
    except Exception as e:
        print(f"Erro ao carregar {user_artists_path}: {e}")
        return None, None

    try:
        artists = pd.read_csv(artists_path, encoding='utf-8')
        artists.columns = [col.strip().replace(' ', '_') for col in artists.columns]
        print(f"Colunas em artists: {artists.columns.tolist()}")
        if not all(col in artists.columns for col in ['id', 'name']):
             raise ValueError("Colunas esperadas (id, name) não encontradas em artists.csv")
        # Renomeia 'id' para 'artistID' para consistência
        artists.rename(columns={'id': 'artistID'}, inplace=True)

    except FileNotFoundError:
        print(f"Erro: Arquivo não encontrado em {artists_path}")
        return user_artists, None # Retorna user_artists mesmo se artists falhar
    except Exception as e:
        print(f"Erro ao carregar {artists_path}: {e}")
        return user_artists, None

    print("Dados carregados com sucesso.")
    return user_artists, artists

def create_user_item_matrix(user_artists_df):
    """Cria a matriz esparsa de interações usuário-artista.

    Args:
        user_artists_df (pd.DataFrame): DataFrame com userID, artistID e weight.

    Returns:
        tuple: Contendo:
            - scipy.sparse.csr_matrix: Matriz esparsa usuário-artista.
            - dict: Mapeamento de artistID para índice da matriz.
            - dict: Mapeamento de userID para índice da matriz.
    """
    print("Criando a matriz usuário-artista...")
    # Remove duplicatas, mantendo a maior interação (maior weight)
    user_artists_df = user_artists_df.sort_values('weight', ascending=False)
    user_artists_df = user_artists_df.drop_duplicates(subset=['userID', 'artistID'], keep='first')

    # Cria mapeamentos para garantir índices contínuos a partir de 0
    user_ids = user_artists_df['userID'].unique()
    artist_ids = user_artists_df['artistID'].unique()

    user_id_map = {id: i for i, id in enumerate(user_ids)}
    artist_id_map = {id: i for i, id in enumerate(artist_ids)}

    # Mapeia os IDs nos DataFrames para os novos índices
    user_indices = user_artists_df['userID'].map(user_id_map)
    artist_indices = user_artists_df['artistID'].map(artist_id_map)

    # Cria a matriz esparsa
    # Usamos 'weight' como dado. Se não quiser usar o peso, pode usar 1
    # O formato CSR (Compressed Sparse Row) é eficiente para operações de linha (como encontrar vizinhos)
    user_item_matrix = csr_matrix((
        user_artists_df['weight'],
        (user_indices, artist_indices)
    ),
    shape=(len(user_id_map), len(artist_id_map)))

    print(f"Matriz criada com shape: {user_item_matrix.shape}")
    return user_item_matrix, artist_id_map, user_id_map

# --- 2. Treinamento do Modelo KNN ---
def train_knn_model(user_item_matrix, n_neighbors=20, metric='cosine'):
    """Treina o modelo NearestNeighbors.

    Args:
        user_item_matrix (scipy.sparse.csr_matrix): Matriz usuário-artista.
        n_neighbors (int): Número de vizinhos a considerar.
        metric (str): Métrica de distância ('cosine' é recomendada para dados esparsos).

    Returns:
        sklearn.neighbors.NearestNeighbors: Modelo KNN treinado.
    """
    print(f"Treinando o modelo KNN (k={n_neighbors}, métrica={metric})...")
    # O algoritmo 'brute' é geralmente necessário para métricas como 'cosine' em matrizes esparsas.
    # 'n_jobs=-1' usa todos os processadores disponíveis para acelerar.
    model_knn = NearestNeighbors(metric=metric, algorithm='brute', n_neighbors=n_neighbors, n_jobs=-1)
    model_knn.fit(user_item_matrix)
    print("Modelo KNN treinado.")
    return model_knn

# --- 3. Geração de Recomendações ---
def recommend_artists(user_id, user_item_matrix, model_knn, user_id_map, artist_id_map, artists_df, n_recommendations=10):
    """Gera recomendações de artistas para um usuário específico.

    Args:
        user_id (int): ID do usuário para o qual gerar recomendações.
        user_item_matrix (scipy.sparse.csr_matrix): Matriz usuário-artista.
        model_knn (sklearn.neighbors.NearestNeighbors): Modelo KNN treinado.
        user_id_map (dict): Mapeamento de userID para índice da matriz.
        artist_id_map (dict): Mapeamento de artistID para índice da matriz.
        artists_df (pd.DataFrame): DataFrame com informações dos artistas (id, name).
        n_recommendations (int): Número de recomendações a gerar.

    Returns:
        pd.DataFrame: DataFrame com os artistas recomendados (ID, Nome, Score Estimado), 
                      ou None se o usuário não for encontrado.
    """
    print(f"Gerando recomendações para o usuário ID: {user_id}")

    # Verifica se o user_id existe no mapeamento
    if user_id not in user_id_map:
        print(f"Erro: Usuário com ID {user_id} não encontrado na base de dados.")
        return None

    # Obtém o índice do usuário na matriz
    user_index = user_id_map[user_id]

    # Encontra os vizinhos mais próximos
    # kneighbors retorna as distâncias e os índices dos vizinhos
    # Pegamos o vetor de interações do usuário (linha da matriz)
    user_vector = user_item_matrix[user_index]

    # +1 em n_neighbors porque o próprio usuário pode ser retornado como vizinho mais próximo (distância 0)
    distances, indices = model_knn.kneighbors(user_vector, n_neighbors=model_knn.n_neighbors + 1)

    # Remove o próprio usuário dos vizinhos (geralmente o primeiro, com distância 0)
    # Flatten para transformar os arrays 2D em 1D
    neighbor_indices = indices.flatten()[1:]
    neighbor_distances = distances.flatten()[1:]

    if len(neighbor_indices) == 0:
        print(f"Nenhum vizinho encontrado para o usuário {user_id}.")
        return pd.DataFrame(columns=['artistID', 'name', 'estimated_score'])

    print(f"Vizinhos encontrados: {len(neighbor_indices)}")

    # --- Agregação e Filtragem ---
    # Obtém os artistas que o usuário alvo JÁ ouviu
    # .indices retorna os índices das colunas (artistas) onde há valores não nulos na linha do usuário
    known_artist_indices = user_vector.indices

    # Inverte o mapeamento artist_id_map para buscar ID original pelo índice
    index_artist_map = {v: k for k, v in artist_id_map.items()}

    # Dicionário para armazenar os scores de recomendação dos artistas candidatos
    recommendation_scores = {}

    # Itera sobre os vizinhos encontrados
    for i, neighbor_idx in enumerate(neighbor_indices):
        neighbor_vector = user_item_matrix[neighbor_idx]
        neighbor_distance = neighbor_distances[i]

        # Similaridade = 1 - distância (para métrica cosseno, onde 0 é mais similar)
        # Adiciona um pequeno epsilon para evitar divisão por zero se a distância for 1
        similarity_weight = 1 - neighbor_distance

        # Itera sobre os artistas que o vizinho ouviu
        for artist_idx in neighbor_vector.indices:
            # Verifica se o usuário alvo JÁ conhece este artista
            if artist_idx not in known_artist_indices:
                # Se não conhece, adiciona/atualiza o score de recomendação
                # O score é a soma das similaridades dos vizinhos que ouviram esse artista
                # Isso dá mais peso a artistas ouvidos por vizinhos mais similares
                if artist_idx not in recommendation_scores:
                    recommendation_scores[artist_idx] = 0
                recommendation_scores[artist_idx] += similarity_weight * neighbor_vector[0, artist_idx] # Pondera pela similaridade e pelo weight original

    if not recommendation_scores:
        print(f"Nenhum artista novo encontrado nos vizinhos para recomendar ao usuário {user_id}.")
        return pd.DataFrame(columns=['artistID', 'name', 'estimated_score'])

    # Converte os scores em um DataFrame e ordena
    recommended_artist_indices = list(recommendation_scores.keys())
    scores = list(recommendation_scores.values())

    recommendations_df = pd.DataFrame({
        'artistIndex': recommended_artist_indices,
        'estimated_score': scores
    })

    # Mapeia de volta para os IDs originais dos artistas
    recommendations_df['artistID'] = recommendations_df['artistIndex'].map(index_artist_map)

    # Ordena pelas maiores pontuações
    recommendations_df = recommendations_df.sort_values('estimated_score', ascending=False)

    # Junta com os nomes dos artistas
    if artists_df is not None:
        recommendations_df = pd.merge(
            recommendations_df,
            artists_df[['artistID', 'name']],
            on='artistID',
            how='left'
        )
        # Seleciona e reordena as colunas finais
        final_columns = ['artistID', 'name', 'estimated_score']
    else:
        # Se não tiver o dataframe de artistas, retorna só o ID
        final_columns = ['artistID', 'estimated_score']

    recommendations_df = recommendations_df[final_columns].head(n_recommendations)

    print(f"Recomendações geradas para o usuário {user_id}.")
    return recommendations_df

# --- 4. Execução Principal e Teste ---
if __name__ == '__main__':
    start_time = time.time()

    # Caminhos para os arquivos CSV (ajuste se necessário)
    USER_ARTISTS_CSV = './data/user_artists.csv'
    ARTISTS_CSV = './data/artists.csv'

    # Carrega os dados
    user_artists_df, artists_df = load_data(USER_ARTISTS_CSV, ARTISTS_CSV)

    if user_artists_df is not None:
        # Cria a matriz esparsa
        user_item_matrix, artist_id_map, user_id_map = create_user_item_matrix(user_artists_df)

        # Treina o modelo KNN
        # Ajuste n_neighbors conforme necessário (mais vizinhos pode dar mais diversidade, mas ser mais lento)
        knn_model = train_knn_model(user_item_matrix, n_neighbors=25, metric='cosine')

        # --- Teste de Recomendação ---
        # Escolha um userID para testar (ex: usuário 2, que existe no .dat original)
        test_user_id = 948

        if test_user_id in user_id_map: # Verifica se o ID de teste existe após o mapeamento
            recommendations = recommend_artists(
                user_id=test_user_id,
                user_item_matrix=user_item_matrix,
                model_knn=knn_model,
                user_id_map=user_id_map,
                artist_id_map=artist_id_map,
                artists_df=artists_df,
                n_recommendations=25 # Pede 25 recomendações
            )

            if recommendations is not None and not recommendations.empty:
                print(f"\n--- Top 25 Recomendações para Usuário {test_user_id} ---")
                print(recommendations.to_string(index=False))
            elif recommendations is not None:
                 print(f"\nNão foi possível gerar recomendações para o usuário {test_user_id} (talvez não haja artistas novos nos vizinhos).")

        else:
            print(f"\nUsuário de teste ID {test_user_id} não encontrado nos dados processados.")
            # Tenta encontrar um usuário válido para teste
            if user_id_map:
                first_user_id = next(iter(user_id_map)) # Pega o primeiro ID do mapeamento
                print(f"Tentando recomendação para o primeiro usuário encontrado: ID {first_user_id}")
                recommendations = recommend_artists(
                    user_id=first_user_id,
                    user_item_matrix=user_item_matrix,
                    model_knn=knn_model,
                    user_id_map=user_id_map,
                    artist_id_map=artist_id_map,
                    artists_df=artists_df,
                    n_recommendations=25
                )
                if recommendations is not None and not recommendations.empty:
                    print(f"\n--- Top 25 Recomendações para Usuário {first_user_id} ---")
                    print(recommendations.to_string(index=False))
                elif recommendations is not None:
                    print(f"\nNão foi possível gerar recomendações para o usuário {first_user_id}.")
            else:
                print("\nNão há usuários no mapeamento para testar.")

    else:
        print("\nNão foi possível carregar os dados. Saindo...")

    end_time = time.time()
    print(f"\nTempo total de execução: {end_time - start_time:.2f} segundos")

