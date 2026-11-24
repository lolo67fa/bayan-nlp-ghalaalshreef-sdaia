# Bayan demo image (CPU). Build from the repository root:
#   docker build -f demo/Dockerfile -t bayan-demo .
#   docker run -p 7860:7860 bayan-demo
# Also used as the root Dockerfile of a Hugging Face Docker Space (see demo/README.md).
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    HF_HOME=/home/user/.cache/huggingface

RUN useradd -m -u 1000 user
WORKDIR /home/user/app

COPY demo/requirements.txt demo/requirements.txt
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu \
 && pip install -r demo/requirements.txt

COPY --chown=user src/bayan src/bayan
COPY --chown=user data/sample data/sample
COPY --chown=user demo demo

USER user
# Bake the public search model into the image so a cold start does not download it.
RUN python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2')"

EXPOSE 7860
CMD ["uvicorn", "demo.app:app", "--host", "0.0.0.0", "--port", "7860"]
