FROM ubuntu:22.04
ARG TARGETARCH
RUN apt-get update && apt-get install -y curl

COPY ./tmp/sub-image /app/sub-image

WORKDIR /app

EXPOSE 4003
ENTRYPOINT ["/app/sub-image"]
