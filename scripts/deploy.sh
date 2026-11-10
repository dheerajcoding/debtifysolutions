#!/usr/bin/env bash
# One-command deploy for godebtify.com. Run on the server:   /app/debtify/scripts/deploy.sh
#
# What it does: pulls the latest code, builds a new image, swaps the running container for a
# new one (same port and settings), waits until the site answers, and rolls back by itself if it
# does not. The previous container is kept as "godebtify-old" so you can roll back by hand too.
#
# Settings come from /root/godebtify.env (kept outside the repo, never committed).
set -euo pipefail

APP_DIR="${APP_DIR:-/app/debtify}"
NAME="godebtify"
BACKUP="godebtify-old"
HOST_PORT="${HOST_PORT:-5003}"
CONTAINER_PORT=5000
ENV_FILE="${ENV_FILE:-/root/godebtify.env}"
WAIT_SECONDS=60

# Everything lives in main() so bash reads the whole script before running it. That keeps the
# script safe even though "git pull" below can replace this very file.
main() {
  log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
  fail() { printf '\n\033[1;31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

  # Only one deploy at a time (running it twice by accident is what breaks the swap).
  exec 9>/var/lock/godebtify-deploy.lock
  flock -n 9 || fail "Another deploy is already running. Wait for it to finish."

  command -v docker >/dev/null || fail "docker is not installed or not on PATH."
  [ -d "$APP_DIR/.git" ] || fail "$APP_DIR is not a git clone."
  [ -f "$ENV_FILE" ] || fail "Settings file $ENV_FILE is missing, so the new container could not start with your secrets."
  cd "$APP_DIR"

  log "Pulling latest code"
  before="$(git rev-parse --short HEAD)"
  git pull --ff-only origin main || fail "git pull failed. The server folder has local changes or has diverged from GitHub. Nothing was changed."
  after="$(git rev-parse --short HEAD)"
  echo "Code: $before -> $after"

  log "Building the new image (the live site keeps running meanwhile)"
  docker build -t "$NAME:new" . || fail "Build failed. The live site was not touched."

  log "Swapping containers (a few seconds of downtime)"
  had_old=0
  if docker inspect "$NAME" >/dev/null 2>&1; then
    docker rm -f "$BACKUP" >/dev/null 2>&1 || true
    docker stop "$NAME" >/dev/null
    docker rename "$NAME" "$BACKUP"
    had_old=1
  fi

  rollback() {
    printf '\n\033[1;31mNew version failed. Rolling back...\033[0m\n' >&2
    docker logs --tail 30 "$NAME" >&2 || true
    docker rm -f "$NAME" >/dev/null 2>&1 || true
    if [ "$had_old" = 1 ]; then
      docker rename "$BACKUP" "$NAME"
      docker start "$NAME" >/dev/null
      echo "Rolled back: the previous version is running again." >&2
    fi
    exit 1
  }

  docker run -d --name "$NAME" --restart unless-stopped \
    -p "${HOST_PORT}:${CONTAINER_PORT}" --env-file "$ENV_FILE" "$NAME:new" >/dev/null || rollback

  log "Waiting for the site to answer (up to ${WAIT_SECONDS}s)"
  ok=0
  for _ in $(seq 1 $((WAIT_SECONDS / 2))); do
    if [ "$(docker inspect -f '{{.State.Running}}' "$NAME" 2>/dev/null)" != "true" ]; then break; fi
    if curl -fsS -o /dev/null --max-time 3 "http://127.0.0.1:${HOST_PORT}/"; then ok=1; break; fi
    sleep 2
  done
  [ "$ok" = 1 ] || rollback

  docker tag "$NAME:new" "$NAME:latest"
  docker image prune -f >/dev/null 2>&1 || true

  log "Deployed ($after)"
  docker ps --filter "name=^${NAME}$" --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
  echo
  echo "Open https://godebtify.com and hard-refresh (Ctrl+Shift+R)."
  if [ "$had_old" = 1 ]; then
    echo "Previous version kept as '$BACKUP'. Roll back by hand with:"
    echo "  docker rm -f $NAME && docker rename $BACKUP $NAME && docker start $NAME"
  fi
}

main "$@"
exit $?
