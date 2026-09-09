# ==============================================================================
# AgentOS Core Kernel - Production Optimized Dockerfile
# Target: Koyeb / Oracle Cloud Free Tier (AMD64 / ARM64)
# ==============================================================================
FROM python:3.11-slim as builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final runtime image
FROM python:3.11-slim

WORKDIR /app

# Create unprivileged kernel runner user for sandbox isolation
RUN groupadd -r agentos && useradd -r -g agentos agentos

COPY --from=builder /root/.local /home/agentos/.local
COPY . .

ENV PATH=/home/agentos/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
ENV PORT=8080

RUN chown -R agentos:agentos /app
USER agentos

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/health')" || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
