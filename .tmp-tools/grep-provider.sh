#!/bin/bash
cd /home/midnightshri/Employee-Place
grep -n -E "levelFactory|midnightDbName|sublevel|getScopedLevelName|privateStateStoreName|signingKeyStoreName" frontend/node_modules/@midnight-ntwrk/midnight-js-level-private-state-provider/dist/index.mjs | head -50