#!/bin/sh
set -e

# Wait for a TCP service using Node.js net module (available in all node images)
# This provides defense-in-depth beyond Docker's depends_on healthchecks
wait_for() {
  host="$1"
  port="$2"
  name="$3"
  max="${4:-30}"
  i=0

  echo "Waiting for $name ($host:$port)..."

  until node -e "
    var s = require('net').createConnection($port, '$host', function(){
      s.end();
      process.exit(0);
    });
    s.on('error', function(){
      s.destroy();
      process.exit(1);
    });
    setTimeout(function(){ process.exit(1); }, 2000);
  " 2>/dev/null; do
    i=$((i + 1))
    if [ "$i" -ge "$max" ]; then
      echo "ERROR: $name not available after ${max}s" >&2
      exit 1
    fi
    sleep 1
  done

  echo "$name is ready"
}

wait_for "${DATABASE_HOST:-postgres}" "${DATABASE_PORT:-5432}" "PostgreSQL"
wait_for "${REDIS_HOST:-redis}" "${REDIS_PORT:-6379}" "Redis"
wait_for "${RABBITMQ_HOST:-rabbitmq}" "${RABBITMQ_PORT:-5672}" "RabbitMQ"

exec "$@"
