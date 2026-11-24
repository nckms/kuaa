#!/bin/sh
set -e

node scripts/reconcile-migrations.mjs
npx prisma migrate deploy

exec "$@"
