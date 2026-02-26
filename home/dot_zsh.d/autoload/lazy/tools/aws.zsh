#!/bin/zsh

# Opens AWS Console for a given ARN
arn-open() {
    arn="$1"

    open-cli "https://console.aws.amazon.com/go/view?arn=${arn}"
}
