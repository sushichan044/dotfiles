typeset -gU path PATH

autoload -U colors
colors

setopt no_beep
setopt globdots
setopt auto_cd

setopt hist_ignore_dups
setopt hist_ignore_space
setopt share_history
SAVEHIST=100
HISTFILE=$HOME/.zsh_history
