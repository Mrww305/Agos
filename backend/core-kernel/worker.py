"""
AgentOS Core Kernel - Upstash Redis Queue Worker Loop
Continuously polls the Redis queue, handles concurrency, and drives task execution.
"""

import os
import json
import time
import asyncio
import redis
from supabase import create_client, Client
from agent_engine import AgentExecutionEngine

class QueueWorker:
    def __init__(self):
        self.supabase_url = os.getenv("SUPABASE_URL")
        self.supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        self.redis_url = os.getenv("UPSTASH_REDIS_URL") # e.g. rediss://default:...@...upstash.io:6379
        self.queue_name = os.getenv("QUEUE_NAME", "agentos:tasks:queue")
        self.is_running = False

        if not self.supabase_url or not self.supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be provided")

        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        self.engine = AgentExecutionEngine(self.supabase)
        self.redis_client = None

        if self.redis_url:
            self.redis_client = redis.from_url(
                self.redis_url,
                decode_responses=True,
                socket_timeout=10,
                retry_on_timeout=True
            )

    async def start(self):
        self.is_running = True
        print(f"[Core Kernel] Worker started. Polling queue '{self.queue_name}'...")

        while self.is_running:
            try:
                if self.redis_client:
                    # BRPOP blocking pop with 5 second timeout to remain non-blocking to asyncio loop
                    item = await asyncio.to_thread(self.redis_client.brpop, self.queue_name, 5)
                    if item:
                        _, raw_payload = item
                        payload = json.loads(raw_payload)
                        print(f"[Core Kernel] Received task payload: {payload.get('taskId')}")
                        await self.engine.execute_task(payload)
                else:
                    # Polling fallback if direct TCP Redis isn't provided (using Supabase tasks queue directly)
                    pending_tasks = self.supabase.table("tasks")\
                        .select("*")\
                        .eq("status", "pending")\
                        .order("enqueued_at", desc=False)\
                        .limit(1)\
                        .execute()
                    
                    if pending_tasks.data:
                        t = pending_tasks.data[0]
                        payload = {
                            "taskId": t["id"],
                            "agentId": t["agent_id"],
                            "prompt": t["full_prompt"],
                            "priority": t["priority"]
                        }
                        await self.engine.execute_task(payload)
                    else:
                        await asyncio.sleep(2.0)

            except Exception as e:
                print(f"[Core Kernel] Error in worker loop: {e}")
                await asyncio.sleep(3.0)

    def stop(self):
        self.is_running = False
        print("[Core Kernel] Worker stopping...")
