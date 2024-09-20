from dotenv import load_dotenv
from common import get_database_connections_pool, recreate_db

if __name__ == "__main__":
    # loads environment variables from .env
    load_dotenv()

    AGREE_RESPONSE = "ok"

    print(
        f"""ATTENTION!
          this script drops current table
          type \"{AGREE_RESPONSE}\" to continue
          """
    )
    response = input()

    if response != AGREE_RESPONSE:
        exit(0)

    pool = get_database_connections_pool(1)
    recreate_db(pool)
