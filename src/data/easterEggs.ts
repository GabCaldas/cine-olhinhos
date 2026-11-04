import { EasterEggId, EasterEggInfo } from '../types/horror';

export const EASTER_EGGS: Record<EasterEggId, EasterEggInfo> = {
  hidden_minion: {
    id: 'hidden_minion',
    title: 'O Intruso Amarelo na Pipoqueira Retrô',
    location: 'Carrinho de Pipoca Dourado na Entrada',
    hint: 'Duas lentes metálicas redondas estão espiando de dentro do vidro quente da máquina de pipoca...',
    discoveryText:
      'A tampa da pipoqueira se levanta! Um Minion de óculos e macacão pula do meio das pipocas segurando uma banana, grita "Bello! Banana!" e mergulha de volta no milho!',
  },
  fantastic_mr_fox: {
    id: 'fantastic_mr_fox',
    title: 'O Fantástico Sr. Raposo (Assobio & Click-Click)',
    location: 'Adega de Cidra de Maçã Dourada',
    hint: 'Uma garrafa de cidra dourada brilha perto de uma cauda felpuda cor de laranja e um terno de veludo mostarda...',
    discoveryText:
      'O Fantástico Sr. Raposo ajeita o paletó de veludo cotelê, olha para vocês dois, dá seu clássico assobio seguido de dois estalos de língua (*fi-fiu... click-click!*) e brinda com cidra!',
  },
  megamind: {
    id: 'megamind',
    title: 'Megamente: "Diferença? APRESENTAÇÃO!"',
    location: 'Cabine de Raios Azuis & Holofote',
    hint: 'Um dispositivo azul futurista com uma capa preta de gola alta pisca com energia elétrica na parede...',
    discoveryText:
      'Luzes de rock e relâmpagos azuis iluminam o corredor! Megamente surge flutuando com sua capa preta e o Raio de Desidratação: "Qual a diferença entre um vilão e um supervilão? APRESENTAÇÃO!"',
  },
  eeaao_rocks: {
    id: 'eeaao_rocks',
    title: 'As Duas Pedras do Multiverso (EEAAO)',
    location: 'Terrário do Deserto Silencioso',
    hint: 'Duas pedras imóveis repousam lado a lado em um pequeno cânion silencioso, com um par de olhinhos plásticos por perto...',
    discoveryText:
      'O som ao redor silencia em paz absoluta. Dois olhinhos plásticos (googly eyes) se abrem na pedra da esquerda e uma legenda amarela aparece no ar: "Aqui tudo é calmo. Apenas seja uma pedra."',
  },
  wild_robot: {
    id: 'wild_robot',
    title: 'Roz & Bico-Vivo (Robô Selvagem)',
    location: 'Jardim Interno Iluminado do Cinema',
    hint: 'Entre flores silvestres e musgo verde, um chassi metálico redondo reflete a luz suave ao lado de uma pena de ganso...',
    discoveryText:
      'Os olhos circulares de Roz (ROZZUM 7134) se acendem com carinho! Uma borboleta pousa em sua mão metálica enquanto o pequeno gansinho Bico-Vivo bate as asas em seu ombro.',
  },
  totoro: {
    id: 'totoro',
    title: 'Meu Amigo Totoro no Ponto de Ônibus',
    location: 'Placa de Ponto de Ônibus & Guarda-Chuva',
    hint: 'Uma placa redonda de ônibus e um guarda-chuva vermelho encostado na parede escondem pequenas bolinhas pretas de fuligem...',
    discoveryText:
      'Poeirinhas mágicas (Susuwatari) saem correndo e o grande e fofinho Totoro aparece segurando uma folha verde na cabeça e abrindo um sorriso gigante sob o guarda-chuva!',
  },
  teen_beach: {
    id: 'teen_beach',
    title: 'Teen Beach Movie: Surfistas vs. Motoqueiros',
    location: 'Prancha de Surf Anos 60 & Jaqueta de Couro',
    hint: 'Uma prancha de surf listrada retrô está encostada ao lado de uma jaqueta preta de motoqueiro dos anos 60...',
    discoveryText:
      'Uma onda tropical neon brilha pela parede ao som de guitarras de surf rock! A prancha mágica de Brady e Mack reluz entre o sol da praia e o estilo de "Cruisin\' for a Bruisin\'"!',
  },
  pitch_perfect: {
    id: 'pitch_perfect',
    title: 'Pitch Perfect: O Ritmo do Cup Song',
    location: 'Bancada Acústica das Barden Bellas',
    hint: 'Um copo plástico azul solitário está virado para baixo ao lado de um microfone prateado com laço amarelo...',
    discoveryText:
      'Clap-clap, tap-tap-tap! O copo bate no balcão no ritmo perfeito de "When I\'m Gone" enquanto o microfone das Barden Bellas solta notas musicais douradas em harmonia a capella!',
  },
  secret_vhs: {
    id: 'secret_vhs',
    title: 'O Projetor 35mm e a Bobina Dourada #00',
    location: 'Projetor Cinematográfico Clássico no Fim da Galeria',
    hint: 'O grande projetor de rolo 35mm no final do corredor guarda uma bobina dourada trancada na base...',
    discoveryText:
      'As bobinas de 35mm começam a girar em luz dourada! Dentro do compartimento secreto estava guardada a Bobina #00, revelando o Quadro Secreto Especial de Caldas & Aninha no final do corredor!',
  },
};

export const TOTAL_EASTER_EGGS = Object.keys(EASTER_EGGS).length;
