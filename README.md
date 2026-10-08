# First-Class

## Ideia inicial

> Rascunho de conceito. Nada aqui é definitivo.

Acho que a gente poderia trabalhar com uma dinâmica familiar em meio a um mundo completamente caótico. Um exemplo seria tentar fazer com que seus filhos ainda tenham uma infância, mesmo com o fim do mundo acontecendo ao redor deles.

Também gostaria que a parte de gestão financeira fosse algo realmente importante, que fizesse o jogador sentir o desespero e o caos que estão acontecendo do lado de fora. Para isso, acho interessante existirem coisas que, em teoria, seriam "fúteis" para gastar dinheiro, como comprar um buquê para a esposa, chocolate para os filhos, brinquedos e coisas desse tipo.

Eu vejo esses pequenos gastos como algo que pode impactar diretamente a percepção que o jogador tem da realidade daquele mundo. Tipo, você sabe que está faltando dinheiro e que a situação está ficando cada vez pior, mas mesmo assim pode escolher gastar com alguma coisa que deixe sua família um pouco mais feliz. Acho que são essas pequenas decisões que vão ajudar a mostrar para o jogador que tipo de mundo é esse.

E para conseguirmos fazer isso direito, vamos precisar MUITO da equipe de arte, mas muito mesmo. Acho que a fidelidade visual vai ser extremamente importante nesse caso, porque boa parte dessa percepção do mundo pode vir justamente do que o jogador está vendo, e não só do que está escrito na história.

Ao mesmo tempo, eu gostaria que o jogo fosse um pouco mais scriptado, principalmente para conseguirmos terminar o projeto em um tempo razoável e não acabarmos criando infinitas variáveis e possibilidades. Minha ideia seria ter, no máximo, uns 31 dias de história, cada um com seus acontecimentos e decisões. É só uma ideia por enquanto, não é nada concreto, mas foi nisso que consegui pensar agora.

## Resumo rápido

- **Tema:** família tentando manter a normalidade (e a infância dos filhos) durante o fim do mundo.
- **Mecânica central:** gestão financeira apertada, com gastos "fúteis" (flores, chocolate, brinquedos) competindo com a sobrevivência.
- **Arte:** peça-chave; o mundo é percebido principalmente pelo visual, não só pelo texto.
- **Escopo:** história scriptada, até ~31 dias, cada um com seus eventos e decisões.

---

## Project DevCity (protótipo jogável)

Simulador de estúdio de games (1976 → hoje), feito a partir do relatório de UI/UX. Abra `devcity/index.html` no navegador; não precisa instalar nada.

O que já tem: controle de tempo com pausa (Espaço, 1/2/3), escritório isométrico em canvas, abas acessíveis (Desenvolvimento, Hardware, Marketing, Finanças, Equipe e imóveis, Pesquisa, Propriedades), sliders com gráfico de radar, contador de bugs com dupla confirmação acima de 100, crunch com burnout e vazamentos, consoles com mapa de calor e "luz vermelha", overhype, compra hostil de rivais, IPs lendárias, review bombing e save automático no navegador.

Teste rápido (joga ~40 anos com um bot): `NODE_PATH=$(npm root -g) node devcity/smoke.cjs`
