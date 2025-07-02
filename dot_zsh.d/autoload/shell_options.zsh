typeset -gU path PATH

autoload -U colors
colors

setopt no_beep
setopt globdots
setopt auto_cd
setopt interactive_comments

setopt hist_ignore_dups
setopt hist_ignore_all_dups
setopt hist_ignore_space
setopt hist_reduce_blanks
setopt share_history
SAVEHIST=100
HISTFILE=$HOME/.zsh_history

# '/' を単語の境界として認める
# https://blog.3qe.us/entry/2025/05/20/201219
typeset -g WORDCHARS=${WORDCHARS:s@/@}
