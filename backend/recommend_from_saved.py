# -*- coding: utf-8 -*-
"""
Script de Recomendação Rápida de Artistas (v3 - Correção JSON)

Este script:
1. Carrega um modelo KNN pré-treinado, a matriz usuário-artista e os mapeamentos
   de ID salvos por 'train_and_save_model.py' usando joblib.
2. Recebe um ID de usuário (userID) e o número de recomendações desejadas 
   como argumentos de linha de comando.
3. Gera recomendações de artistas para esse usuário.
4. Converte os tipos de dados (int64, float32) para tipos nativos Python (int, float)
   antes da serialização JSON.
5. Imprime as recomendações (artistID e score) em formato JSON para fácil 
   consumo por outras aplicações (como uma API Node.js).
6. Mantém logs detalhados no stderr para diagnóstico.
"""

import joblib
import argparse
import os
import json
import pandas as pd # Usado apenas para criar o DataFrame final
import time
import sys # Para direcionar logs para stderr
import numpy as np # Para verificar tipos numpy

# --- Configurações --- 
# Determina o diretório onde este script está localizado
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
print(f"[Debug stderr] Diretório do script: {SCRIPT_DIR}", file=sys.stderr)

# Caminho onde os arquivos do modelo foram salvos (relativo ao script)
MODEL_DIR = SCRIPT_DIR # Assume que os .joblib estão no mesmo diretório do script
MODEL_FILENAME = os.path.join(MODEL_DIR, "knn_model.joblib")
MATRIX_FILENAME = os.path.join(MODEL_DIR, "user_item_matrix.joblib")
USER_MAP_FILENAME = os.path.join(MODEL_DIR, "user_id_map.joblib")
INDEX_ARTIST_MAP_FILENAME = os.path.join(MODEL_DIR, "index_artist_map.joblib")

# --- 1. Carregamento dos Artefatos Salvos ---
def load_artifacts():
    """Carrega o modelo, matriz e mapeamentos salvos.

    Returns:
        tuple: Contendo (model, matrix, user_map, index_artist_map) ou None em caso de erro.
    """
    print("[Debug stderr] Carregando artefatos salvos...", file=sys.stderr)
    artifacts_found = True
    for f_path in [MODEL_FILENAME, MATRIX_FILENAME, USER_MAP_FILENAME, INDEX_ARTIST_MAP_FILENAME]:
        if not os.path.exists(f_path):
            print(f"[Error stderr] Arquivo não encontrado: {f_path}", file=sys.stderr)
            artifacts_found = False
    
    if not artifacts_found:
        print("[Error stderr] Um ou mais arquivos .joblib não foram encontrados.", file=sys.stderr)
        print(f"[Error stderr] Verifique se os arquivos existem em: {MODEL_DIR}", file=sys.stderr)
        print("[Error stderr] Execute o script 'train_and_save_model.py' primeiro.", file=sys.stderr)
        return None
        
    try:
        print(f"[Debug stderr] Carregando modelo de: {MODEL_FILENAME}", file=sys.stderr)
        model = joblib.load(MODEL_FILENAME)
        print(f"[Debug stderr] Carregando matriz de: {MATRIX_FILENAME}", file=sys.stderr)
        matrix = joblib.load(MATRIX_FILENAME)
        print(f"[Debug stderr] Carregando mapa de usuários de: {USER_MAP_FILENAME}", file=sys.stderr)
        user_map = joblib.load(USER_MAP_FILENAME)
        print(f"[Debug stderr] Carregando mapa índice->artista de: {INDEX_ARTIST_MAP_FILENAME}", file=sys.stderr)
        index_artist_map = joblib.load(INDEX_ARTIST_MAP_FILENAME)
        print(f"[Debug stderr] Artefatos carregados com sucesso. Total de usuários no mapa: {len(user_map)}", file=sys.stderr)
        return model, matrix, user_map, index_artist_map
    except Exception as e:
        print(f"[Error stderr] Erro ao carregar arquivos com joblib: {e}", file=sys.stderr)
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
    print(f"[Debug stderr] Gerando {n_recommendations} recomendações para userID: {user_id}", file=sys.stderr)

    if user_id not in user_id_map:
        print(f"[Warning stderr] Usuário com ID {user_id} não encontrado no mapeamento carregado.", file=sys.stderr)
        return []

    user_index = user_id_map[user_id]
    print(f"[Debug stderr] Índice do usuário na matriz: {user_index}", file=sys.stderr)
    user_vector = user_item_matrix[user_index]

    # Encontra vizinhos (+1 pois o próprio usuário pode ser retornado)
    print(f"[Debug stderr] Encontrando {model_knn.n_neighbors + 1} vizinhos...", file=sys.stderr)
    distances, indices = model_knn.kneighbors(user_vector, n_neighbors=model_knn.n_neighbors + 1)

    # Remove o próprio usuário (geralmente o primeiro)
    neighbor_indices = indices.flatten()[1:]
    neighbor_distances = distances.flatten()[1:]

    if len(neighbor_indices) == 0:
        print(f"[Warning stderr] Nenhum vizinho encontrado para o usuário {user_id}.", file=sys.stderr)
        return []
    
    print(f"[Debug stderr] Vizinhos encontrados: {len(neighbor_indices)}", file=sys.stderr)

    known_artist_indices = user_vector.indices
    print(f"[Debug stderr] Usuário {user_id} conhece {len(known_artist_indices)} artistas.", file=sys.stderr)
    
    recommendation_scores = {}
    potential_recommendations_count = 0

    # Itera sobre os vizinhos
    for i, neighbor_idx in enumerate(neighbor_indices):
        neighbor_vector = user_item_matrix[neighbor_idx]
        similarity_weight = 1 - neighbor_distances[i] # Similaridade Cosseno

        # Itera sobre os artistas que o vizinho ouviu
        for artist_idx in neighbor_vector.indices:
            # Verifica se o usuário alvo JÁ conhece este artista
            if artist_idx not in known_artist_indices:
                potential_recommendations_count += 1
                # Se não conhece, adiciona/atualiza o score de recomendação
                if artist_idx not in recommendation_scores:
                    recommendation_scores[artist_idx] = 0
                # Pondera pela similaridade e pelo weight original da interação do vizinho
                recommendation_scores[artist_idx] += similarity_weight * neighbor_vector[0, artist_idx]

    print(f"[Debug stderr] Total de artistas potenciais (não conhecidos pelo usuário) encontrados nos vizinhos: {potential_recommendations_count}", file=sys.stderr)
    print(f"[Debug stderr] Número de artistas únicos com score > 0: {len(recommendation_scores)}", file=sys.stderr)

    if not recommendation_scores:
        print(f"[Warning stderr] Nenhum artista novo encontrado nos vizinhos para recomendar ao usuário {user_id}.", file=sys.stderr)
        return []

    # Cria lista de resultados
    recommendations = []
    for artist_idx, score in recommendation_scores.items():
        artist_id = index_artist_map.get(artist_idx) # Busca o ID original
        if artist_id is not None:
            # *** CORREÇÃO APLICADA AQUI ***
            # Converte tipos NumPy para tipos nativos Python antes de adicionar à lista
            final_artist_id = int(artist_id) if isinstance(artist_id, (np.integer, np.int64)) else artist_id
            final_score = float(score) if isinstance(score, (np.float_, np.float32, np.float64)) else score
            recommendations.append({"artistID": final_artist_id, "score": final_score})
        else:
             print(f"[Warning stderr] Índice de artista {artist_idx} não encontrado no mapa index_artist_map.", file=sys.stderr)

    # Ordena pela pontuação (score) em ordem decrescente
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    print(f"[Debug stderr] Recomendações geradas e ordenadas com sucesso.", file=sys.stderr)
    return recommendations[:n_recommendations]

# --- 3. Execução Principal e Argumentos de Linha de Comando ---
if __name__ == "__main__":
    start_time = time.time()

    parser = argparse.ArgumentParser(description="Gera recomendações de artistas para um usuário usando um modelo KNN pré-treinado.")
    parser.add_argument("user_id", type=int, help="ID do usuário para gerar recomendações.")
    parser.add_argument("-n", "--num_recommendations", type=int, default=10, help="Número de recomendações a serem geradas (padrão: 10).")

    args = parser.parse_args()
    print(f"[Debug stderr] Argumentos recebidos: userID={args.user_id}, n={args.num_recommendations}", file=sys.stderr)

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
    else:
        print("[Error stderr] Não foi possível carregar os artefatos. Saindo.", file=sys.stderr)

    # Imprime o resultado como JSON na saída padrão (stdout)
    # Isso facilita a captura pela aplicação Node.js
    print("\n--- JSON Output ---") # Mantém essa linha para o regex no Node.js funcionar
    try:
        print(json.dumps(recommendations_list, indent=2))
        print("[Debug stderr] JSON gerado e impresso com sucesso.", file=sys.stderr)
    except TypeError as e:
        # Adiciona um log extra caso a conversão ainda falhe por algum motivo
        print(f"[Error stderr] Erro final ao tentar serializar para JSON: {e}", file=sys.stderr)
        print(f"[Error stderr] Dados que falharam na serialização: {recommendations_list}", file=sys.stderr)
        # Imprime um JSON vazio para não quebrar o Node.js completamente
        print("[]") 

    end_time = time.time()
    # Imprime tempo no stderr para não poluir o JSON
    print(f"\nTempo total de execução da recomendação: {end_time - start_time:.4f} segundos", file=sys.stderr) 