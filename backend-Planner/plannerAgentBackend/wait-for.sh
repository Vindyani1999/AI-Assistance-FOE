#!/bin/sh
# wait-for.sh

set -e

host="$1"
shift
cmd="$@"

echo "Waiting for $host to be ready..."
until nc -z "$host" 3306; do
  sleep 2
  echo "Still waiting for $host..."
done

echo "$host is up - executing command"
exec $cmd
