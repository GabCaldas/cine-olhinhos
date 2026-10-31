import { EasterEggId, EasterEggInfo } from '../types/horror';

export const EASTER_EGGS: Record<EasterEggId, EasterEggInfo> = {
  jason_mask: {
    id: 'jason_mask',
    title: 'Relíquia na Panóplia de Entrada',
    location: 'Parede de Entrada do Corredor',
    hint: 'Há um escudo de madeira escura pendurado logo depois da porta principal...',
    discoveryText:
      'Ao tocar no suporte de madeira, a máscara desgastada parece respirar no escuro e a lâmina presa atrás dela vibra contra a parede.',
  },
  ghostface: {
    id: 'ghostface',
    title: 'Vulto Atrás da Cortina & Telefone Antigo',
    location: 'Janela Gótica com Cortinas de Veludo',
    hint: 'O telefone sobre a mesinha lateral pisca perto de uma cortina pesada que se mexe sozinha...',
    discoveryText:
      'O telefone toca estridente! Quando vocês puxam o veludo da janela, uma figura encapuzada recua rapidamente para a escuridão com o brilho de uma lâmina.',
  },
  hidden_minion: {
    id: 'hidden_minion',
    title: 'Intruso Amarelo na Portinhola do Rodapé',
    location: 'Alçapão Secreto no Rodapé de Madeira',
    hint: 'Duas lentes metálicas redondas estão espiando por uma fresta solta na madeira do rodapé...',
    discoveryText:
      'A tábua solta do rodapé se abre! Uma criaturinha amarela de óculos e macacão dá um pulo segurando uma banana, sussurra "Bello!" e se tranca de volta na parede.',
  },
  pennywise_balloon: {
    id: 'pennywise_balloon',
    title: 'O Balão Preso na Grade do Chão',
    location: 'Ralo de Ferro no Assoalho',
    hint: 'Um fio vermelho está amarrado nas barras de ferro de um ralo escuro no chão...',
    discoveryText:
      'Dois olhos amarelos se abrem na escuridão embaixo do assoalho enquanto um balão vermelho sobe lentamente do ralo e flutua até o teto.',
  },
  jigsaw_billy: {
    id: 'jigsaw_billy',
    title: 'O Triciclo na Porta da Despensa',
    location: 'Porta Entreaberta com Corrente',
    hint: 'Uma fresta de luz vermelha escapa por baixo de uma porta trancada com corrente...',
    discoveryText:
      'A porta range e se abre mais um pouco. Do breu do quarto vazio, um pequeno triciclo vermelho avança sozinho até a soleira com uma risada metálica.',
  },
  shining_twins: {
    id: 'shining_twins',
    title: 'Aparição no Espelho Veneziano',
    location: 'Grande Espelho de Moldura Dourada',
    hint: 'O espelho antigo na parede parece refletir mais do que apenas o corredor vazio...',
    discoveryText:
      'Ao limpar o vidro embaçado, o reflexo mostra duas figuras idênticas de mãos dadas paradas no fundo do corredor — mas quando vocês olham para trás, não há ninguém.',
  },
  cursed_portrait: {
    id: 'cursed_portrait',
    title: 'O Retrato que Observa a Galeria',
    location: 'Pintura a Óleo sobre o Candelabro',
    hint: 'Uma pintura antiga e austera parece mudar de expressão quando a luz das velas oscila...',
    discoveryText:
      'A moldura entorta sozinha no prego e a tinta escura se desfaz, revelando um rosto pálido coberto por um véu negro que acompanha os passos de vocês.',
  },
  crt_tv: {
    id: 'crt_tv',
    title: 'Transmissão Noturna no Aparador',
    location: 'Televisão de Tubo sobre o Móvel Antigo',
    hint: 'Uma televisão desligada no fim da galeria emite um chiado elétrico bem baixinho...',
    discoveryText:
      'O tubo liga sozinho em estática máxima mostrando a borda de um poço de pedra na chuva, enquanto água começa a pingar do vidro para o tapete.',
  },
  secret_vhs: {
    id: 'secret_vhs',
    title: 'O Compartimento do Relógio Parado',
    location: 'Relógio de Pêndulo às 03:33',
    hint: 'O grande relógio de madeira no fim do corredor parou às 03:33 e tem uma fechadura vermelha na base...',
    discoveryText:
      'A portinhola do pêndulo se destranca! Dentro dela estava escondida a Fita #00, fazendo surgir um quadro secreto inédito no final do corredor!',
  },
};

export const TOTAL_EASTER_EGGS = Object.keys(EASTER_EGGS).length;
