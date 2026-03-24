#  Totem de Acesso Facial

Sistema de reconhecimento facial desenvolvido para totens de acesso, integrando validação de CPF e biometria em tempo real.

## Stack
* **Vue.js 3** (Composition API)
* **Tailwind CSS** (Estilização Moderna)
* **face-api.js** (Inteligência Artificial baseada em TensorFlow.js)
* **Vite** (Build Tool de alta performance)

##  Funcionalidades
-  Entrada de dados via CPF com máscara.
-  Confirmação de identidade visual.
-  Reconhecimento facial em tempo real com modelo TinyFace.
-  UX de carregamento progressivo (5 segundos de atenção para validar).
-  Design responsivo e focado em acessibilidade (Botões grandes para touch).

##  Como rodar o projeto
1. Clone o repositório: `git clone https://github.com/SEU_USUARIO/totem-acesso.git`
2. Instale as dependências: `npm install`
3. Inicie o servidor: `npm run dev`

> **Nota:** Certifique-se de que os modelos de IA (reconhecimento) estão na pasta `/public/models`.
