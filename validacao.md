# Validação do Sistema de Reconhecimento Facial para Totem de Autoatendimento

Este documento apresenta o processo de validação do sistema de reconhecimento facial desenvolvido para um totem de autoatendimento. 

Para a validação da solução foram utilizados:
- Artigos científicos relacionados à área de reconhecimento facial;
- Uma base de dados pública disponibilizada na plataforma Kaggle.

## Trabalhos e Materiais de Referência

**Código de Referência**
O desenvolvimento inicial utilizou como base o seguinte projeto disponível no GitHub: <br>

Nome do projeto: face-api.js <br>
Link: https://github.com/justadudewhohacks/face-api.js.git

O código foi estudado e adaptado para atender aos requisitos específicos do sistema de autoatendimento.

**Artigos Científicos**

Como fundamentação teórica foram utilizados os artigos: 
1. LU, Peng; SONG, Baoye; XU, Lin. “Human face recognition based on convolutional neural network and augmented dataset”. Oct, 2020. Disponível em: https://doi.org/10.1080/21642583.2020.1836526.
   
Este artigo propõe uma abordagem para reconhecimento facial humano baseada na combinação de uma Rede Neural Convolucional (CNN) com técnicas de aumento de dados (data augmentation). O modelo utilizou o 
conjunto de imagens presentes no dataset Olivetti Research Laboratory (ORL) face dataset disponível em: https://www.kaggle.com/datasets/tavarez/the-orl-database-for-training-and-testing. Essa base foi
ampliada e utilizada para treinar uma CNN projetada para ser resistente a variações nas imagens, como mudanças de posição, escala e orientação. 

2. BASURAH, Muhammad; SWASTIKA, Windra; KELANA, Oesman H. “Implementation of Face Recognition and Liveness Detection System Using TensorFlow.js”. 2023. Disponível em: https://pdfs.semanticscholar.org/4e0e/f9f3fe11a467cc1371cac8ccef12310d8dc2.pdf

O estudo investiga métodos de detecção de vivacidade (liveness detection) aplicados a sistemas de reconhecimento facial, com o objetivo de prevenir ataques de falsificação realizados por meio de fotos, 
vídeos ou outras representações faciais. A abordagem proposta utiliza modelos de inteligência artificial implementados com TensorFlow.js e Face-api.js para analisar movimentos e expressões faciais, 
verificando a presença de um usuário real diante da câmera.

3. JULIANDY, Carles; WONG, Ng Poi; DARWIN. “Modeling Face Detection Application Using Convolutional Neural Network and Face-API for Effective and Efficient Online Attendance Tracking”. Abril, 2024. Disponível em: https://doi.org/10.15575/join.v9i1.1203.

O artigo apresenta um sistema automatizado de controle de presença para aulas e reuniões online utilizando reconhecimento facial. A proposta surgiu devido às dificuldades enfrentadas durante a pandemia 
de COVID-19, quando a adoção do ensino remoto tornou mais complexa a verificação da participação dos alunos. O sistema utiliza a biblioteca Face-api.js para detectar os rostos presentes em capturas de tela 
de plataformas de videoconferência, como Zoom e Google Meet, e uma Rede Neural Convolucional (CNN) para identificar cada indivíduo com base em um conjunto de imagens previamente cadastrado.

4. THOHIR, Muhammad I.; KHARISMA, Ivana L.; IKA. “Web-Based Employee Attendance System Utilizing Face Recognition And CNN Via Face-API.js”. 2025. Disponível em: https://doi.org/10.32877/bt.v8i2.2828.

O artigo apresenta o desenvolvimento de um sistema de controle de presença de funcionários baseado em reconhecimento facial para ambientes corporativos. Os autores destacam que métodos tradicionais de 
registro de presença, sejam manuais ou digitais simples, estão sujeitos a fraudes e não garantem a presença física do colaborador. Para solucionar esse problema, foi proposta uma aplicação web que utiliza 
Face-API.js e Redes Neurais Convolucionais (CNN) para realizar a identificação facial em tempo real.

**Base de Dados**

Para validação e testes do sistema foi utilizada a base de dados:

Nome: The Olivetti Research Laboratory (ORL) face dataset <br>
Origem: Kaggle <br>
Link: https://www.kaggle.com/datasets/tavarez/the-orl-database-for-training-and-testing

A base de dados ORL Database of Faces foi desenvolvida para pesquisas em reconhecimento facial e contém 400 imagens distribuídas entre 40 indivíduos distintos, com 10 imagens para cada pessoa. 
As fotografias foram capturadas entre 1992 e 1994 em condições controladas, mas apresentam variações de iluminação, expressões faciais (como sorrindo ou não) e características visuais, como o uso de óculos. 
Todas as imagens possuem fundo escuro uniforme e mostram os indivíduos em posição frontal, permitindo pequenas variações de inclinação e movimento lateral. Essas características tornam a base adequada para 
avaliação e validação de algoritmos de reconhecimento facial.

## Metodologia da Validação

Para validação do projeto foi criado um programa em JavaScript que:

1. Carrega os modelos de detecção facial;
2. Processa 400 imagens do dataset “The Olivetti Research Laboratory (ORL) face dataset” (320 treino, 80 teste);
3. Extrai descritores faciais das imagens;
4. Classifica as imagens de teste comparando com o treino;
5. Gera um arquivo CSV com resultados e métricas.

O código fonte dessa validação pode ser encontrado neste mesmo repositório em backend/scripts/testDataset.js no branch feat/validacao.

Como executar? 
1. Abra um terminal dentro do projeto;
2. Execute cd d:\Downloads\projetoVC\totem-autoatendimento-faceid\backend para encontrar a pasta do script;
3. Execute node scripts/testDataset.js para rodar o script; 

Resultado esperado: <br>
Após executar, você verá no terminal: <br>
✅ Modelos carregados <br>
📚 Total de imagens: 400 <br>
   Treino: 320 <br>
   Teste: 80 <br>
📊 Resultado do teste (quantidade de acertos, acurácia, precisão, matriz de confusão) <br>
💾 Resultados salvos em CSV: dataset_test_results.csv 

## Resultados Obtidos 

Ao executar a validação, os resultados obtidos foram:

📊 Resultado do teste: <br>
   Acertos: 79/80 <br>
   Acurácia: 98.75% <br>
   Precisão micro: 1.0000 <br>
   Precisão macro: 1.0000 <br>

📊 Matriz de Confusão (Resumo)

| Classe | Acertos | Erros |
|---------|---------:|------:|
| s1  | 2 | 0 |
| s2  | 2 | 0 |
| s3  | 2 | 0 |
| ... | ... | ... |
| s31 | 2 | 0 |
| s32 | 1 | 1 |
| s33 | 2 | 0 |
| ... | ... | ... |
| s40 | 2 | 0 |

A matriz de confusão demonstrou excelente desempenho do sistema de reconhecimento facial. Das 80 imagens utilizadas para teste (2 imagens por indivíduo), a única falha observada ocorreu para o indivíduo **s32**, em que uma das imagens não atingiu o limiar mínimo de confiança para identificação e não foi reconhecida, sendo classificada como **NO_PREDICTION**.

Além disso, um arquivo csv foi criado automaticamente após o fim da execução, contendo todos os resultados do modelo. Esse arquivo pode ser encontrado neste repositório em backend/dataset_test_results.csv no branch feat/validacao.

## Comparação com o Artigo de Referência

A base de dados “The Olivetti Research Laboratory (ORL) face dataset” foi utilizada no artigo #1 de forma aumentada para treinar uma Rede Neural Convolucional. 

Os autores avaliaram o impacto da ampliação da base de dados no desempenho do modelo, obtendo os seguintes resultados:

| Quantidade de imagens utilizadas | Acurácia (%) |
|---------|---------:|
| 100000  | 2.5 |
| 200000  | 23 |
| 300000  | 95 |
| 400000 | 97 |

No experimento realizado neste projeto, foi utilizada a mesma base ORL contendo apenas as 400 imagens originais, sem aplicação de técnicas de ampliação. Mesmo assim, a solução baseada em Face-API.js alcançou uma acurácia de 98,75%, com 79 acertos em 80 imagens de teste.

Essa comparação sugere que a utilização de modelos pré-treinados disponibilizados pelo Face-API.js apresentou excelente desempenho sobre a base ORL, alcançando uma acurácia superior à reportada no artigo analisado, mesmo sem a necessidade de gerar centenas de milhares de imagens sintéticas para treinamento.

