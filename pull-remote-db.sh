#!/bin/bash

npx wrangler d1 export ins-posts --remote --output=./database-sensitive-no-share.sql
npx wrangler d1 execute ins-posts --local --file=./reset-db.sql
npx wrangler d1 execute ins-posts --local --file=./database-sensitive-no-share.sql
