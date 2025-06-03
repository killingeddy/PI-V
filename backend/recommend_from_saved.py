# -*- coding: utf-8 -*-
"""
Script de Recomendação Rápida de Artistas

Este script:
1. Carrega um modelo KNN pré-treinado, a matriz usuário-artista e os mapeamentos
   de ID salvos por 'train_and_save_model.py' usando joblib.
2. Recebe um ID de usuário (userID) e o número de recomendações desejadas 
   como argumentos de linha de comando.
3. Gera recomendações de artistas para esse usuário.
4. Imprime as recomendações (artistID e score) em formato JSON para fácil 
   consumo por outras aplicações (como uma API Node.js).
"""

import joblib
import argparse
import os
import json
import pandas as pd # Usado apenas para criar o DataFrame final
import time

# --- Configurações --- 
# Caminho onde os arquivos do modelo foram salvos
MODEL_DIR = "." # Assume que está no mesmo diretório do script de treino
MODEL_FILENAME = os.path.join(MODEL_DIR, "knn_model.joblib")
MATRIX_FILENAME = os.path.join(MODEL_DIR, "user_item_matrix.joblib")
USER_MAP_FILENAME = os.path.join(MODEL_DIR, "user_id_map.joblib")
# ARTIST_MAP_FILENAME = os.path.join(MODEL_DIR, "artist_id_map.joblib") # Não estritamente necessário aqui
INDEX_ARTIST_MAP_FILENAME = os.path.join(MODEL_DIR, "index_artist_map.joblib")

# --- 1. Carregamento dos Artefatos Salvos ---
def load_artifacts():
    """Carrega o modelo, matriz e mapeamentos salvos.

    Returns:
        tuple: Contendo (model, matrix, user_map, index_artist_map) ou None em caso de erro.
    """
    print("Carregando artefatos salvos (modelo, matriz, mapas)...")
    try:
        if not all(os.path.exists(f) for f in [MODEL_FILENAME, MATRIX_FILENAME, USER_MAP_FILENAME, INDEX_ARTIST_MAP_FILENAME]):
            print("Erro: Arquivos de modelo/matriz/mapas não encontrados.")
            print(f"Certifique-se de que os arquivos {MODEL_FILENAME}, {MATRIX_FILENAME}, {USER_MAP_FILENAME}, e {INDEX_ARTIST_MAP_FILENAME} existem no diretório {MODEL_DIR}.")
            print("Execute o script 'train_and_save_model.py' primeiro.")
            return None

        model = joblib.load(MODEL_FILENAME)
        matrix = joblib.load(MATRIX_FILENAME)
        user_map = joblib.load(USER_MAP_FILENAME)
        index_artist_map = joblib.load(INDEX_ARTIST_MAP_FILENAME)
        print("Artefatos carregados com sucesso.")
        return model, matrix, user_map, index_artist_map
    except Exception as e:
        print(f"Erro ao carregar arquivos com joblib: {e}")
        return None

# --- 2. Geração de Recomendações (Adaptada do script original) ---
def generate_recommendations(user_id, model_knn, user_item_matrix, user_id_map, index_artist_map, n_recommendations=10):
    """Gera recomendações de artistas para um usuário específico usando artefatos carregados.

    Args:
        user_id (int): ID do usuário.
        model_knn: Modelo KNN carregado.
        user_item_matrix: Matriz usuário-artista carregada.
        user_id_map (dict): Mapeamento userID -> índice.
        index_artist_map (dict): Mapeamento índice -> artistID.
        n_recommendations (int): Número de recomendações a gerar.

    Returns:
        list: Lista de dicionários, cada um contendo {"artistID": id, "score": score},
              ou uma lista vazia se não houver recomendações ou o usuário não for encontrado.
    """
    print(f"Gerando {n_recommendations} recomendações para o usuário ID: {user_id}")

    if user_id not in user_id_map:
        print(f"Aviso: Usuário com ID {user_id} não encontrado no mapeamento carregado.")
        # Retorna uma lista vazia em JSON para consistência
        return []

    user_index = user_id_map[user_id]
    user_vector = user_item_matrix[user_index]

    # Encontra vizinhos (+1 pois o próprio usuário pode ser retornado)
    distances, indices = model_knn.kneighbors(user_vector, n_neighbors=model_knn.n_neighbors + 1)

    neighbor_indices = indices.flatten()[1:]
    neighbor_distances = distances.flatten()[1:]

    if len(neighbor_indices) == 0:
        print(f"Nenhum vizinho encontrado para o usuário {user_id}.")
        return []

    known_artist_indices = user_vector.indices
    recommendation_scores = {}

    for i, neighbor_idx in enumerate(neighbor_indices):
        neighbor_vector = user_item_matrix[neighbor_idx]
        similarity_weight = 1 - neighbor_distances[i] # Similaridade Cosseno

        for artist_idx in neighbor_vector.indices:
            if artist_idx not in known_artist_indices:
                if artist_idx not in recommendation_scores:
                    recommendation_scores[artist_idx] = 0
                # Pondera pela similaridade e pelo weight original da interação do vizinho
                recommendation_scores[artist_idx] += similarity_weight * neighbor_vector[0, artist_idx]

    if not recommendation_scores:
        print(f"Nenhum artista novo encontrado nos vizinhos para recomendar ao usuário {user_id}.")
        return []

    # Cria lista de resultados
    recommendations = []
    for artist_idx, score in recommendation_scores.items():
        artist_id = index_artist_map.get(artist_idx) # Busca o ID original
        if artist_id is not None:
            recommendations.append({"artistID": artist_id, "score": score})

    # Ordena pela pontuação (score) em ordem decrescente
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    print(f"Recomendações geradas com sucesso.")
    return recommendations[:n_recommendations]

# --- 3. Execução Principal e Argumentos de Linha de Comando ---
if __name__ == "__main__":
    start_time = time.time()

    parser = argparse.ArgumentParser(description="Gera recomendações de artistas para um usuário usando um modelo KNN pré-treinado.")
    parser.add_argument("user_id", type=int, help="ID do usuário para gerar recomendações.")
    parser.add_argument("-n", "--num_recommendations", type=int, default=10, help="Número de recomendações a serem geradas (padrão: 10).")

    args = parser.parse_args()

    # Carrega os artefatos
    loaded_artifacts = load_artifacts()

    recommendations_list = [] # Lista para armazenar os resultados
    if loaded_artifacts:
        model, matrix, user_map, index_artist_map = loaded_artifacts

        # Gera recomendações
        recommendations_list = generate_recommendations(
            user_id=args.user_id,
            model_knn=model,
            user_item_matrix=matrix,
            user_id_map=user_map,
            index_artist_map=index_artist_map,
            n_recommendations=args.num_recommendations
        )

    # Imprime o resultado como JSON na saída padrão (stdout)
    # Isso facilita a captura pela aplicação Node.js
    print("\n--- JSON Output ---")
    print(json.dumps(recommendations_list, indent=2))

    end_time = time.time()
    print(f"\nTempo total de execução da recomendação: {end_time - start_time:.4f} segundos", file=sys.stderr) # Imprime tempo no stderr para não poluir o JSON

