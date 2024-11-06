
# sushichan044/dotfiles

## Setup

> [!TIP]
> memo here
> https://scrapbox.io/sushichan044/%E7%92%B0%E5%A2%83%E6%A7%8B%E7%AF%89

Linux / macOS / WSL

```bash
sh -c "$(curl -fsLS get.chezmoi.io)" -- init --apply sushichan044 --ssh
```

Windows (PowerShell)

```powershell
iex "&{$(irm 'https://get.chezmoi.io/ps1')} init --apply sushichan044 --ssh"
```
