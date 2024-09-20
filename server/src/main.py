from dotenv import load_dotenv
from my_sql.common import (
    get_database_connections_pool,
    write_new_result,
    get_cached_request,
    get_all_user_requests,
    recreate_db,
)

# TODO(vvsg): may be we should set it as arg
THREADS_COUNT = 5

if __name__ == "__main__":
    # loads environment variables from .env
    load_dotenv()

    db_connections = get_database_connections_pool(THREADS_COUNT)

    # examples of usage
    recreate_db(db_connections)
    write_new_result("test_key1", "2 + 2", "4", db_connections)
    write_new_result("test_key2", "2 + 3", "5", db_connections)
    write_new_result("test_key2", "2 + 7", "9", db_connections)
    # be careful! result from cache might be null
    assert get_cached_request("2 + 2", db_connections) == "4"
    assert len(get_all_user_requests("test_key1", db_connections)) == 1
    assert len(get_all_user_requests("test_key2", db_connections)) == 2

    print(*get_all_user_requests("test_key1", db_connections))
