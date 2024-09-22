from dotenv import load_dotenv
from my_sql.common import (
    get_database_connections_pool,
    write_new_result,
    get_cached_request,
    get_all_user_requests,
    recreate_db,
)

import asyncio
import websockets
import json
from evaluation.eval import evaluate_expression

# TODO(vvsg): may be we should set it as arg
THREADS_COUNT = 5

# Dictionary to hold user -> set of WebSocket connections
user_connections = {}

async def broadcast_to_user(user, message):
    # Send the message to all connected clients of the specified user
    if user in user_connections:
        for connection in user_connections[user]:
            await connection.send(message)

async def handler(websocket):
    global db_connections
    user = None

    try:
        async for message in websocket:
            data = json.loads(message)
            user = data["user"]
            if user not in user_connections:
                user_connections[user] = set()
            user_connections[user].add(websocket)
            if data["type"] == "eval_expr":
                expr = data["expr"]
                result = evaluate_expression(expr)
                write_new_result(user, expr, result[0], db_connections)
                if result[1]:
                    await websocket.send(json.dumps({"type" : "eval_expr", "user": user, "expr": expr, "result" : result[0]}))
                    await broadcast_to_user(user, json.dumps({"type": "update", "user": user, "data": "you need to update"})) 
                else:
                    await websocket.send(json.dumps({"type" : "eval_expr", "user": user, "result" : "error", "error" : result[0]}))
            elif data["type"] == "get_history":
                history = get_all_user_requests(user, db_connections)
                await websocket.send(json.dumps({"type" : "get_history", "user": user, "result" : history}))
            else:
                await websocket.send(json.dumps({"user": user, "error": "Unknown message type"}))
    except Exception as e:
        print("Got Error: ", e)
    finally:
        print("Unregister websocket")
        # Unregister the connection on disconnect
        if user and user in user_connections:
            user_connections[user].remove(websocket)
            if not user_connections[user]:  # Remove the user entry if no connections left
                del user_connections[user]

async def main():
    async with websockets.serve(handler, "0.0.0.0", 5000):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # loads environment variables from .env
    load_dotenv()

    global db_connections
    db_connections = get_database_connections_pool(THREADS_COUNT)

    asyncio.run(main())
