#!/bin/sh
if type op >/dev/null 2>&1; then
    eval "$(op signin)"
fi
