FROM python:3.6

COPY . /app
WORKDIR /app

RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["/bin/sh", "download-pmd.sh"]

EXPOSE 5000

CMD ["python3", "api.py"]
