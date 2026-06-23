#!/bin/sh

# remove zsh compiled cache
rm -rf "$XDG_CACHE_HOME/zsh"
rm -rf "$XDG_CACHE_HOME"/*.zwc
rm -rf "$HOME"/*.zwc
rm -rf "$HOME"/.zcompdump*