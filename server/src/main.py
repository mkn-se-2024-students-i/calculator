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

async def handler(websocket):
    global db_connections
    async for message in websocket:
        data = json.loads(message)
        if data["type"] == "eval_expr":
            user = data["user"]
            expr = data["expr"]
            result = evaluate_expression(expr)
            write_new_result(user, expr, result, db_connections)
            if result[1]:
                await websocket.send(json.dumps({"type" : "eval_expr", "user": user, "expr": expr, "result" : result[0]}))
                await websocket.send(json.dumps({"type": "update", "user": user, "data": "you need to update"}))
            else:
                await websocket.send(json.dumps({"type" : "eval_expr", "user": user, "result" : "error", "error" : result[0]}))
        elif data["type"] == "update_history":
            user = data["user"]
            history = get_all_user_requests(user, db_connections)
            await websocket.send(json.dumps({"type" : "update_history", "user": user, "result" : history}))
        else:
            await websocket.send(json.dumps({"user": user, "error": "Unknown message type"}))

async def main():
    async with websockets.serve(handler, "0.0.0.0", 5000):
        await asyncio.Future()  # run forever

if __name__ == "__main__":
    # loads environment variables from .env
    load_dotenv()

    global db_connections
    db_connections = get_database_connections_pool(THREADS_COUNT)

    asyncio.run(main())
