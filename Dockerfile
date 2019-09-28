FROM python:3.6

COPY ./requirements.txt /app/
COPY ./download-pmd.sh /app/
WORKDIR /app

RUN ["pip", "install", "-r", "requirements.txt"]
RUN ["/bin/sh", "download-pmd.sh"]
RUN apt-get update && apt-get install -y openjdk-11-jre

COPY . /app

CMD ["gunicorn", "-b", "0.0.0.0:5000", "-w", "8", "--threads", "12", "api"]
