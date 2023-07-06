FROM python:3.11

WORKDIR /code

COPY ./requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

COPY ./Backend ./Backend
COPY ./Frontend ./usr/share/nginx/html

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]