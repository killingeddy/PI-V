import pandas as pd
import numpy as np
from scipy.sparse import csr_matrix
from sklearn.neighbors import NearestNeighbors
import psycopg2
import joblib
import time
import os

DB_CONFIG = {
    "dbname": "neondb",
    "user": "neondb_owner",
    "password": "npg_CcPLVblj0z3I",
    "host": "ep-tiny-truth-a83ayuf0-pooler.eastus2.azure.neon.tech",
    "port": "5432"
}

MODEL_DIR = "."
MODEL_FILENAME = os.path.join(MODEL_DIR, "knn_model.joblib")
MATRIX_FILENAME = os.path.join(MODEL_DIR, "user_item_matrix.joblib")
USER_MAP_FILENAME = os.path.join(MODEL_DIR, "user_id_map.joblib")
ARTIST_MAP_FILENAME = os.path.join(MODEL_DIR, "artist_id_map.joblib")
INDEX_ARTIST_MAP_FILENAME = os.path.join(MODEL_DIR, "index_artist_map.joblib")

N_NEIGHBORS = 25
METRIC = 'cosine'

def load_data_from_db(db_config):
    print("Conectando ao banco de dados PostgreSQL...")
    conn = None
    try:
        conn = psycopg2.connect(**db_config)
        print("Conexão bem-sucedida.")

        print("Carregando dados de user_artists...")
        sql_user_artists = "SELECT \"userID\", \"artistID\", \"weight\" FROM user_artists;"
        user_artists_df = pd.read_sql(sql_user_artists, conn)
        print(f"{len(user_artists_df)} interações usuário-artista carregadas.")

        print("Carregando dados de artists...")
        sql_artists = "SELECT id, name FROM artists;"
        artists_df = pd.read_sql(sql_artists, conn)
        artists_df.rename(columns={'id': 'artistID'}, inplace=True)
        print(f"{len(artists_df)} artistas carregados.")

        return user_artists_df, artists_df

    except psycopg2.OperationalError as e:
        print(f"Erro de conexão ao PostgreSQL: {e}")
        print("Verifique as configurações em DB_CONFIG e se o servidor está rodando.")
        return None, None
    except Exception as e:
        print(f"Erro ao carregar dados do banco: {e}")
        return None, None
    finally:
        if conn:
            conn.close()
            print("Conexão com o banco de dados fechada.")

def create_user_item_matrix(user_artists_df):
    print("Criando a matriz usuário-artista...")
    user_artists_df = user_artists_df.sort_values('weight', ascending=False)
    user_artists_df = user_artists_df.drop_duplicates(subset=['userID', 'artistID'], keep='first')

    user_ids = user_artists_df['userID'].unique()
    artist_ids = user_artists_df['artistID'].unique()

    user_id_map = {id: i for i, id in enumerate(user_ids)}
    artist_id_map = {id: i for i, id in enumerate(artist_ids)}
    index_artist_map = {v: k for k, v in artist_id_map.items()}

    user_indices = user_artists_df['userID'].map(user_id_map)
    artist_indices = user_artists_df['artistID'].map(artist_id_map)

    user_item_matrix = csr_matrix((
        user_artists_df['weight'],
        (user_indices, artist_indices)
    ),
    shape=(len(user_id_map), len(artist_id_map)))

    print(f"Matriz criada com shape: {user_item_matrix.shape}")
    return user_item_matrix, artist_id_map, user_id_map, index_artist_map

def train_knn_model(user_item_matrix, n_neighbors=N_NEIGHBORS, metric=METRIC):
    print(f"Treinando o modelo KNN (k={n_neighbors}, métrica={metric})...")
    model_knn = NearestNeighbors(metric=metric, algorithm='brute', n_neighbors=n_neighbors, n_jobs=-1)
    model_knn.fit(user_item_matrix)
    print("Modelo KNN treinado.")
    return model_knn

def save_model_data(model, matrix, user_map, artist_map, index_artist_map):
    print("Salvando modelo, matriz e mapeamentos com joblib...")
    try:
        os.makedirs(MODEL_DIR, exist_ok=True)
        joblib.dump(model, MODEL_FILENAME)
        joblib.dump(matrix, MATRIX_FILENAME)
        joblib.dump(user_map, USER_MAP_FILENAME)
        joblib.dump(artist_map, ARTIST_MAP_FILENAME)
        joblib.dump(index_artist_map, INDEX_ARTIST_MAP_FILENAME)
        print(f"Arquivos salvos em: {MODEL_DIR}/")
        print(f" - Modelo: {MODEL_FILENAME}")
        print(f" - Matriz: {MATRIX_FILENAME}")
        print(f" - Mapa Usuário: {USER_MAP_FILENAME}")
        print(f" - Mapa Artista: {ARTIST_MAP_FILENAME}")
        print(f" - Mapa Índice->Artista: {INDEX_ARTIST_MAP_FILENAME}")
    except Exception as e:
        print(f"Erro ao salvar arquivos com joblib: {e}")

if __name__ == '__main__':
    start_time = time.time()

    user_artists_df, artists_df = load_data_from_db(DB_CONFIG)

    if user_artists_df is not None and artists_df is not None:
        user_item_matrix, artist_id_map, user_id_map, index_artist_map = create_user_item_matrix(user_artists_df)

        knn_model = train_knn_model(user_item_matrix)

        save_model_data(knn_model, user_item_matrix, user_id_map, artist_id_map, index_artist_map)

    else:
        print("\nNão foi possível carregar os dados do banco. Verifique a conexão e as configurações. Saindo...")

    end_time = time.time()
    print(f"\nTempo total de execução do treinamento e salvamento: {end_time - start_time:.2f} segundos")

