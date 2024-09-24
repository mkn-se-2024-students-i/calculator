import os

from collections import namedtuple
from typing import List

import mysql.connector
from mysql.connector import pooling


TABLE_NAME = "requests"

DB_FIELDS_NAMES = ["websocket_key", "timestamp", "request", "result"]

def _get_only_serialiazble_fields() -> list[str]:
    result = DB_FIELDS_NAMES.copy()
    result.remove(DB_FIELDS_NAMES[1])
    return result

DBResult = namedtuple("DBResult", " ".join(_get_only_serialiazble_fields()))

def get_database_connections_pool(
    pool_size: int,
) -> mysql.connector.pooling.MySQLConnectionPool:
    try:
        db_config = {
            "user": os.getenv("DB_USER"),
            "password": os.getenv("DB_PASSWORD"),
            "host": os.getenv("DB_HOST"),
            "database": os.getenv("DB_NAME"),
        }

        connection_pool = mysql.connector.pooling.MySQLConnectionPool(
            pool_name="pool", pool_size=pool_size, **db_config
        )

        return connection_pool
    except Exception as e:
        print(f"Error occurred during connection to database: {e}")
        return None


def write_new_result(
    key: str,
    request: str,
    result: str,
    connection_pool: mysql.connector.pooling.MySQLConnectionPool,
):
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor()

        insert_query = f"""
        INSERT INTO {TABLE_NAME} ({",".join(DB_FIELDS_NAMES)})
        VALUES (%s, NOW(), %s, %s)
        """
        cursor.execute(insert_query, (key, request, result))

        connection.commit()
    except Exception as e:
        print(f"Error occurred during inserting new data: {e}")
    finally:
        if cursor != None:
            cursor.close()
        connection.close()


# look up in db to find such request
def get_cached_request(
    request: str,
    connection_pool: mysql.connector.pooling.MySQLConnectionPool,
) -> str:
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor()

        search_query = f"SELECT result FROM {TABLE_NAME} WHERE request = %s limit 1"
        cursor.execute(search_query, (request,))

        # might be null
        result = cursor.fetchone()
        return result[0]
    except Exception as e:
        print(f"Error occurred during finding result in cache: {e}")
        return None
    finally:
        if cursor != None:
            cursor.close()
        connection.close()


# returns sorted by timestamp list
def get_all_user_requests(
    key: str,
    connection_pool: mysql.connector.pooling.MySQLConnectionPool,
) -> List[DBResult]:
    try:
        connection = connection_pool.get_connection()
        cursor = connection.cursor()

        search_query = f"""
        SELECT {",".join(_get_only_serialiazble_fields())} FROM {TABLE_NAME} WHERE websocket_key = %s order by timestamp
        """
        cursor.execute(search_query, (key,))

        result = []
        for elem in cursor.fetchall():
            result.append(DBResult(*elem))

        return result
    except Exception as e:
        print(f"Error occurred during listing all user requests: {e}")
        return []
    finally:
        if cursor != None:
            cursor.close()
        connection.close()


def recreate_db(
    connection_pool: mysql.connector.pooling.MySQLConnectionPool,
):
    connection = connection_pool.get_connection()
    cursor = connection.cursor()

    drop_table_query = f"""
        DROP TABLE IF EXISTS {TABLE_NAME}
    """
    create_table_query = f"""
    CREATE TABLE {TABLE_NAME} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        {DB_FIELDS_NAMES[0]} VARCHAR(255),
        {DB_FIELDS_NAMES[1]} TIMESTAMP,
        {DB_FIELDS_NAMES[2]} TEXT,
        {DB_FIELDS_NAMES[3]} TEXT
    )
    """
    cursor.execute(drop_table_query)
    cursor.execute(create_table_query)
    connection.commit()

    cursor.close()
    connection.close()
