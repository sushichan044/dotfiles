typeset -gU path PATH

autoload -Uz colors
colors

setopt ignoreeof

setopt auto_cd
setopt auto_pushd
setopt pushd_ignore_dups

setopt no_beep
setopt globdots
setopt interactive_comments

setopt share_history
setopt hist_ignore_all_dups
setopt hist_ignore_space
setopt hist_reduce_blanks

HISTFILE=$ZDOTDIR/.zsh_history
HISTSIZE=2000
SAVEHIST=2000

# '/' を単語の境界として認める
# https://blog.3qe.us/entry/2025/05/20/201219
typeset -g WORDCHARS=${WORDCHARS:s@/@}
