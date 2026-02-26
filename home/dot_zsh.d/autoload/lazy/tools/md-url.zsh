#!/bin/sh

mdurl() {
    local url="$1"

    bunx @mizchi/readability --format md --extract-content "$url"
}
