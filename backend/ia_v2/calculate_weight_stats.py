import pandas as pd

# Caminho para o arquivo CSV
USER_ARTISTS_CSV = '/home/ubuntu/artist_recommendation/data/user_artists.csv'

try:
    # Carrega os dados
    user_artists_df = pd.read_csv(USER_ARTISTS_CSV)
    
    # Calcula estatísticas da coluna 'weight'
    weight_stats = user_artists_df['weight'].describe()
    median_weight = user_artists_df['weight'].median()
    
    print("Estatísticas da coluna 'weight':")
    print(weight_stats)
    print(f"\nMediana do 'weight': {median_weight}")
    
    # Sugestão de valor
    # Usar a mediana ou um valor um pouco acima pode ser uma boa escolha
    suggested_weight = int(median_weight) 
    print(f"\nValor sugerido para 'weight' de novos usuários (mediana): {suggested_weight}")
    
except FileNotFoundError:
    print(f"Erro: Arquivo {USER_ARTISTS_CSV} não encontrado.")
except KeyError:
    print("Erro: Coluna 'weight' não encontrada no arquivo CSV.")
except Exception as e:
    print(f"Ocorreu um erro: {e}")

