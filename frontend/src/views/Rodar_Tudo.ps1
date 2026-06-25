# Abre um novo terminal executando o Backend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '.\totem-autoatendimento-faceid\backend'; npm run dev"

# Abre outro novo terminal executando o Frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '.\totem-autoatendimento-faceid\frontend'; npm run dev"