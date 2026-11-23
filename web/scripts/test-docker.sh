#!/usr/bin/env bash
# Run the full web test suite in Docker (same image CI uses).
# Usage: scripts/test-docker.sh [--no-cache]
set -euo pipefail

cd "$(dirname "$0")/.."

build_args=()
if [[ "${1:-}" == "--no-cache" ]]; then
  build_args+=(--no-cache)
elif [[ $# -gt 0 ]]; then
  echo "Unknown option: $1" >&2
  exit 2
fi

docker-compose build "${build_args[@]+"${build_args[@]}"}" test
docker-compose run --rm test
