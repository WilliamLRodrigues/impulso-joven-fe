export const MIN_APPROVAL_SCORE = 6;

const normalizeKey = (value = "") =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, "_");

const rawAliases = {
  limpeza_basica: ["Limpeza Básica", "Limpeza", "Limpeza Geral"],
  jardinagem: ["Jardinagem", "Cuidados com Jardim"],
  pintura_parede: ["Pintura de Parede", "Pintura"],
  organizacao_ambientes: ["Organização de Ambientes", "Organizacao", "Organizar Ambientes"],
  manutencao_eletrica_basica: ["Manutenção Elétrica Básica", "Eletricidade Básica", "Elétrica", "Eletrica"],
  lavagem_carro: ["Lavagem de Carro", "Lavagem", "Automotivo"],
  montagem_moveis: ["Montagem de Móveis", "Montagem"],
  passeio_pets: ["Passeio com Pets", "Passeio Pet", "Dog Walker", "Pets"],
};

export const trainingModules = {
  limpeza_basica: {
    label: "Limpeza Básica",
    summary: "Preparação adequada, organização das etapas e cordialidade com o cliente.",
    content: [
      "Cumprimente o cliente com cordialidade, apresente-se e confirme quais cômodos ou superfícies precisam de maior atenção.",
      "Organize os materiais fornecidos pelo cliente e utilize EPIs simples, como luvas e máscaras, para proteger sua saúde.",
      "Retire objetos frágeis com cuidado, limpe de cima para baixo e finalize com varrição e pano úmido no piso.",
      "Aplique os produtos conforme instruções do rótulo e jamais misture substâncias que possam gerar gases tóxicos.",
      "Mantenha o cliente informado sobre o andamento, solicitando autorização antes de mover pertences pessoais.",
      "Ao concluir, revise o espaço com o cliente, agradeça pela confiança e pergunte se há ajustes finais desejados.",
    ],
    questions: [
      {
        question: "Qual deve ser a primeira atitude profissional ao chegar para realizar uma limpeza básica?",
        options: [
          "Cumprimentar com gentileza, confirmar prioridades e alinhar expectativas com o cliente",
          "Começar a limpeza imediatamente para ganhar tempo",
          "Pedir para o cliente deixar a casa vazia",
          "Perguntar se é possível terminar em menos de uma hora",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que é importante utilizar luvas e máscara quando necessário?",
        options: [
          "Para proteger sua saúde e demonstrar cuidado profissional",
          "Porque é obrigatório por lei em todas as casas",
          "Para não sujar as mãos com poeira comum",
          "Para impressionar o cliente com equipamentos caros",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a ordem recomendada para uma limpeza eficiente?",
        options: [
          "Organizar materiais, tirar pó de cima para baixo e finalizar com o piso",
          "Começar pelo piso, depois paredes e finalizar com o teto",
          "Limpar primeiro janelas e portas e deixar o restante para o cliente",
          "Molhar todas as superfícies e esperar secar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que deve ser feito antes de mover objetos pessoais do cliente?",
        options: [
          "Pedir autorização e explicar por que o objeto precisa ser movido",
          "Mover rapidamente para terminar mais cedo",
          "Guardar em qualquer lugar para evitar que estraguem",
          "Solicitar que o cliente mova tudo sozinho",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que não se deve misturar produtos de limpeza?",
        options: [
          "Porque pode gerar reações químicas perigosas e gases tóxicos",
          "Porque isso diminui a espuma e dificulta a limpeza",
          "Porque os produtos importados não funcionam bem juntos",
          "Porque deixa o cheiro muito forte e o cliente pode reclamar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como agir quando o cliente pede uma mudança no que já foi combinado?",
        options: [
          "Ouvir com atenção, explicar se o tempo permite e buscar uma solução cordial",
          "Ignorar a solicitação para não atrasar",
          "Cobrar um valor adicional imediatamente",
          "Recusar e encerrar o serviço na hora",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a melhor forma de tratar objetos frágeis?",
        options: [
          "Manusear com cuidado, perguntar onde guardar e registrar qualquer dano",
          "Deixar todos no chão para evitar quedas",
          "Empilhar no canto da sala até terminar",
          "Solicitar que o cliente assine um termo de responsabilidade",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como manter um ambiente de trabalho respeitoso durante a limpeza?",
        options: [
          "Usar linguagem educada, manter boa postura e evitar comentários pessoais",
          "Colocar música alta para animar o serviço",
          "Conversar ao telefone sobre outros clientes",
          "Chamar amigos para ajudar sem avisar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual ação demonstra gentileza ao final do serviço?",
        options: [
          "Apresentar o espaço limpo ao cliente, agradecer e perguntar se deseja algum ajuste",
          "Deixar o local em silêncio e sair sem despedida",
          "Pedir para o cliente conferir sozinho depois",
          "Cobrar gorjeta pela gentileza",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer se perceber falta de materiais essenciais?",
        options: [
          "Avisar o cliente com antecedência para que ele providencie",
          "Usar qualquer produto encontrado, mesmo sem rótulo",
          "Cancelar o serviço por conta própria",
          "Esperar o cliente perceber e trazer outro produto",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  jardinagem: {
    label: "Jardinagem",
    summary: "Cuidados com plantas, ferramentas seguras e atendimento gentil ao cliente.",
    content: [
      "Cumprimente o cliente com respeito, escute as expectativas e confirme quais áreas do jardim serão priorizadas.",
      "Utilize luvas, óculos de proteção e calçados fechados para evitar acidentes com ferramentas ou espinhos.",
      "Verifique o estado das plantas, faça podas com cortes limpos e evite retirar mais de um terço de cada galho por vez.",
      "Identifique pragas de forma cuidadosa e reporte ao cliente, sugerindo soluções seguras e autorizadas.",
      "Mantenha o espaço organizado, recolhendo folhas e resíduos verdes em sacos adequados.",
      "Mostre ao cliente o resultado final, compartilhe dicas de manutenção e agradeça pela confiança.",
    ],
    questions: [
      {
        question: "Qual é a atitude correta ao chegar ao jardim do cliente?",
        options: [
          "Cumprimentar com gentileza, ouvir as expectativas e confirmar as áreas de foco",
          "Começar a podar sem falar nada para ganhar tempo",
          "Pedir para o cliente oferecer ferramentas novas",
          "Solicitar que ninguém observe o trabalho",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que o uso de luvas e óculos é recomendado na jardinagem?",
        options: [
          "Para evitar cortes, perfurações e proteger os olhos de detritos",
          "Somente para evitar sujeira nas mãos",
          "Porque o cliente espera um uniforme completo",
          "Para trabalhar mais rápido sem precisar olhar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como realizar uma poda saudável em arbustos?",
        options: [
          "Remover até um terço do galho, com cortes limpos e inclinados",
          "Cortar todos os galhos na mesma altura",
          "Arrancar os galhos com a mão para não danificar",
          "Deixar a planta totalmente sem folhas",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a melhor forma de lidar com pragas encontradas?",
        options: [
          "Informar o cliente, sugerir soluções seguras e pedir autorização antes de aplicar qualquer produto",
          "Aplicar o veneno mais forte imediatamente",
          "Ignorar para terminar mais cedo",
          "Cobrir a planta com plástico para sufocar as pragas",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que manter o espaço organizado durante o trabalho é importante?",
        options: [
          "Para evitar acidentes, facilitar o serviço e mostrar profissionalismo",
          "Para que o cliente ache que o serviço demorou mais",
          "Para deixar as ferramentas sempre à vista",
          "Para conseguir cobrar mais caro",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como garantir um atendimento gentil com o cliente?",
        options: [
          "Explicar o progresso, ouvir dúvidas e responder com educação",
          "Falar apenas o necessário para não perder tempo",
          "Contar histórias pessoais durante todo o serviço",
          "Gravar vídeos para redes sociais sem pedir autorização",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer com resíduos verdes (folhas e galhos)?",
        options: [
          "Recolher em sacos apropriados e combinar com o cliente o descarte",
          "Deixar espalhados para virar adubo natural",
          "Queimar no local para economizar sacos",
          "Pedir que o cliente guarde sozinho",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como identificar se as plantas precisam de irrigação extra?",
        options: [
          "Observar a umidade do solo e sinais de folhas murchas",
          "Regar sempre duas vezes por dia",
          "Esperar o cliente informar",
          "Usar apenas sensação térmica",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual postura reforça a confiança do cliente?",
        options: [
          "Apresentar o resultado, explicar o que foi feito e agradecer",
          "Sair rapidamente para não responder perguntas",
          "Garantir que não precisa de feedback",
          "Cobrar gorjeta obrigatória",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se encontrar ferramentas do cliente em mau estado, qual é a melhor atitude?",
        options: [
          "Avisar com gentileza, sugerir manutenção ou substituição",
          "Reclamar que o serviço ficará impossível",
          "Usar assim mesmo sem comentar",
          "Cobrar mais caro pelo desgaste",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  pintura_parede: {
    label: "Pintura de Parede",
    summary: "Preparação de superfícies, segurança com tintas e comunicação clara com o cliente.",
    content: [
      "Cumprimente o cliente, confirme cores e áreas a serem pintadas e alinhe as expectativas de acabamento.",
      "Proteja pisos, móveis e tomadas com lonas, fitas e plásticos conforme a necessidade do cliente.",
      "Lixe e limpe a superfície antes de pintar para garantir aderência e acabamento uniforme.",
      "Misture a tinta suavemente, siga o tempo de secagem recomendado e aplique camadas finas e cruzadas.",
      "Mantenha o ambiente ventilado, utilizando máscara adequada para evitar inalação excessiva.",
      "Informe o cliente sobre prazos de secagem, limpe respingos imediatamente e agradeça a confiança ao final.",
    ],
    questions: [
      {
        question: "Antes de começar a pintura, qual é o passo essencial?",
        options: [
          "Cumprimentar o cliente, confirmar cores e proteger o ambiente",
          "Abrir a lata de tinta e aplicar direto na parede",
          "Pedir para o cliente sair de casa",
          "Misturar várias tintas sem consultar o cliente",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que é importante proteger pisos e móveis?",
        options: [
          "Para evitar respingos e demonstrar cuidado com o patrimônio do cliente",
          "Para trabalhar mais devagar",
          "Porque é obrigatório usar plástico em tudo",
          "Para gastar mais fita crepe",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a função de lixar a parede antes de pintar?",
        options: [
          "Remover imperfeições e melhorar a aderência da tinta",
          "Deixar a parede mais brilhante",
          "Gastar material para justificar o valor",
          "Evitar que a parede absorva tinta",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como deve ser a aplicação da tinta para um bom acabamento?",
        options: [
          "Camadas finas e cruzadas, respeitando o tempo de secagem",
          "Uma única camada grossa para terminar rápido",
          "Jogar a tinta com rolo em qualquer direção",
          "Misturar água em excesso para render",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual cuidado de segurança é indispensável?",
        options: [
          "Manter o ambiente ventilado e usar máscara quando necessário",
          "Fechar portas e janelas para não entrar poeira",
          "Trabalhar sem luvas para sentir a parede",
          "Usar ventilador direcionado para a tinta secar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como agir quando o cliente muda a cor durante o serviço?",
        options: [
          "Conversar com respeito, explicar impacto no tempo e buscar um acordo",
          "Continuar com a cor antiga para não atrasar",
          "Cobrar multa e encerrar o trabalho",
          "Ignorar a solicitação e seguir o plano inicial",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer com respingos de tinta?",
        options: [
          "Limpar imediatamente com pano úmido",
          "Deixar secar e pintar por cima",
          "Cobrir com fita para esconder",
          "Esfregar com lixa grossa",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual atitude demonstra gentileza ao final?",
        options: [
          "Apresentar o resultado, explicar tempos de secagem e agradecer",
          "Sair rápido para evitar perguntas",
          "Pedir avaliação sem mostrar o trabalho",
          "Solicitar gorjeta obrigatória",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que alinhar expectativas de acabamento é importante?",
        options: [
          "Para evitar insatisfação e garantir que o resultado desejado seja entregue",
          "Para justificar atrasos que possam ocorrer",
          "Porque a tinta pode ter defeitos",
          "Para permitir que o cliente participe da pintura",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se faltar tinta durante o serviço, qual é a melhor ação?",
        options: [
          "Avisar o cliente com antecedência e combinar como reabastecer",
          "Diluir a tinta restante em muita água",
          "Pintar apenas as partes visíveis",
          "Parar de trabalhar até o cliente descobrir a falta",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  organizacao_ambientes: {
    label: "Organização de Ambientes",
    summary: "Planejamento, comunicação clara e respeito aos pertences do cliente.",
    content: [
      "Cumprimente o cliente com empatia, entenda a rotina da família e defina prioridades de organização.",
      "Classifique itens por categoria, avalie o que pode ser doado, descartado ou realocado, sempre com autorização.",
      "Use caixas, etiquetas e divisórias para manter a lógica de organização acordada.",
      "Mantenha o cliente informado sobre cada mudança proposta, buscando aprovação antes de reposicionar objetos pessoais.",
      "Crie rotinas simples para que o cliente mantenha o espaço organizado após o serviço.",
      "Entregue o ambiente limpo, agradeça e ofereça dicas gentis para conservação diária.",
    ],
    questions: [
      {
        question: "Qual é o primeiro passo ao iniciar a organização de um ambiente?",
        options: [
          "Cumprimentar com simpatia, entender a rotina e alinhar prioridades",
          "Começar a guardar tudo em caixas sem perguntar",
          "Descartar itens que parecem antigos",
          "Fechar a porta e trabalhar sem interferência",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como os itens devem ser separados inicialmente?",
        options: [
          "Por categoria, avaliando o que fica, vai para doação ou descarte com autorização",
          "Por cor, independentemente do uso",
          "Em pilhas aleatórias para ganhar tempo",
          "Guardando tudo o que estiver à vista",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a melhor forma de usar caixas e etiquetas?",
        options: [
          "Manter uma lógica acordada, facilitando a identificação pelo cliente",
          "Enfeitar o ambiente com cores aleatórias",
          "Esconder objetos para deixar o espaço vazio",
          "Guardar itens pesados nas prateleiras mais altas",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Quando propor descarte de algum item, o que deve ser feito?",
        options: [
          "Conversar com respeito, explicar a proposta e aguardar autorização",
          "Jogar fora imediatamente",
          "Perguntar aos vizinhos o que fazer",
          "Vender em sites de usados sem avisar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual postura demonstra bom atendimento durante a organização?",
        options: [
          "Atualizar o cliente com gentileza sobre cada mudança importante",
          "Pedir para o cliente não acompanhar",
          "Reclamar da bagunça anterior",
          "Exigir que o cliente faça o serviço junto",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como garantir que o cliente manterá o espaço organizado?",
        options: [
          "Criando rotinas simples e explicando como usar cada solução",
          "Sugerindo que contrate outra pessoa semanalmente",
          "Entregando um manual complexo sem explicar",
          "Colocando etiquetas secretas para testar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer com objetos pessoais delicados?",
        options: [
          "Manusear com cuidado, perguntar onde guardar e evitar exposição",
          "Tirar fotos e postar nas redes",
          "Guardar todos juntos em uma caixa",
          "Empilhar no chão até terminar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como agir se o cliente tiver dúvida sobre a nova organização?",
        options: [
          "Responder com respeito, demonstrar na prática e reforçar a utilidade",
          "Dizer que descobrirá sozinho",
          "Cobrar uma consultoria extra na hora",
          "Sugerir que procure vídeos na internet",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual atitude final reforça a confiança?",
        options: [
          "Apresentar o resultado, agradecer e oferecer dicas para manutenção",
          "Deixar o local sem se despedir",
          "Fechar o armário para o cliente ver depois",
          "Cobrar avaliação antes de mostrar o serviço",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se faltar caixas ou etiquetas combinadas, o que fazer?",
        options: [
          "Avisar o cliente e combinar alternativas antes de continuar",
          "Parar o serviço e ir comprar por conta própria",
          "Improvisar com sacolas sem comentar",
          "Cancelar a organização naquele dia",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  manutencao_eletrica_basica: {
    label: "Manutenção Elétrica Básica",
    summary: "Segurança, comunicação clara e respeito aos procedimentos autorizados.",
    content: [
      "Cumprimente o cliente com profissionalismo, explique o que será verificado e peça para desligar a energia quando necessário.",
      "Use EPIs como luvas isolantes e calçados adequados, mantendo ferramentas organizadas e inspecionadas.",
      "Sempre desligue o circuito no disjuntor antes de tocar em fios ou tomadas.",
      "Utilize ferramentas isoladas, teste a presença de energia e substitua componentes apenas com autorização.",
      "Explique ao cliente cada passo, reforçando que intervenções além do combinado precisam de aprovação.",
      "Ao finalizar, teste o funcionamento, limpe o local, agradeça e informe sobre cuidados básicos de segurança.",
    ],
    questions: [
      {
        question: "Qual é a primeira medida ao chegar para um reparo elétrico básico?",
        options: [
          "Cumprimentar o cliente, explicar a avaliação e combinar o desligamento de energia",
          "Pedir para usar qualquer ferramenta disponível",
          "Começar a mexer nos fios energizados",
          "Solicitar que o cliente faça o reparo enquanto orienta",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que desligar o disjuntor é indispensável?",
        options: [
          "Para eliminar o risco de choque elétrico durante o serviço",
          "Para economizar energia",
          "Porque o cliente exige",
          "Para usar equipamentos mais simples",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual EPI é recomendado para manutenção elétrica básica?",
        options: [
          "Luvas isolantes e calçados fechados",
          "Sandálias para movimentar-se rápido",
          "Apenas boné e camiseta",
          "Nenhum, desde que seja rápido",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como usar as ferramentas durante o reparo?",
        options: [
          "Utilizar ferramentas isoladas e em bom estado",
          "Emprestar ferramentas do cliente sem verificar",
          "Usar qualquer objeto metálico disponível",
          "Evitar ferramentas para acelerar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer antes de substituir uma tomada?",
        options: [
          "Confirmar com o cliente, desligar o circuito e testar se não há energia",
          "Retirar os fios rapidamente e trocar",
          "Cortar os fios para reduzir o tempo",
          "Solicitar que o cliente troque sozinho",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como demonstrar bom atendimento durante o serviço?",
        options: [
          "Explicando cada passo com linguagem simples e ouvindo dúvidas",
          "Falando termos técnicos para mostrar conhecimento",
          "Evitando conversar para terminar logo",
          "Compartilhando histórias de serviços perigosos",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se áreas além do combinado precisarem de manutenção, o que fazer?",
        options: [
          "Informar o cliente, explicar os riscos e aguardar autorização",
          "Executar tudo sem avisar",
          "Cobrar depois sem comunicar",
          "Ignorar para não atrasar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual teste deve ser feito após finalizar o reparo?",
        options: [
          "Ligar novamente o circuito e verificar se o equipamento funciona corretamente",
          "Deixar o disjuntor desligado",
          "Solicitar que o cliente teste sozinho outro dia",
          "Fornecer garantia sem testar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que manter o local organizado é essencial?",
        options: [
          "Para evitar acidentes, localizar ferramentas e transmitir confiança",
          "Para deixar claro que o serviço demora",
          "Para guardar peças quebradas",
          "Porque o cliente exige silêncio total",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual mensagem final reforça a segurança do cliente?",
        options: [
          "Orientar sobre cuidados básicos e agradecer pela confiança",
          "Dizer que pode mexer nos fios sozinho",
          "Solicitar pagamento extra por avaliação",
          "Reclamar da fiação da casa",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  lavagem_carro: {
    label: "Lavagem de Carro",
    summary: "Cuidado com o veículo, uso correto de produtos e cordialidade com o cliente.",
    content: [
      "Cumprimente o cliente, confirme pontos de atenção (riscos, manchas, rodas) e verifique se há itens pessoais no interior.",
      "Organize o material: balde com água limpa, balde com shampoo automotivo, luva macia, panos de microfibra e escova para rodas.",
      "Faça uma pré-lavagem para tirar poeira solta e, se usar mangueira, feche o jato quando não estiver enxaguando para economizar água.",
      "Lave de cima para baixo: teto, vidros, capô e laterais, sempre com luva macia e movimentos suaves para não riscar a pintura.",
      "Enxágue com frequência para não arrastar sujeira na lataria e evite usar o mesmo pano da carroceria nas rodas.",
      "Limpe rodas e pneus por último, usando escova própria e enxaguando bem para remover lama e poeira de freio.",
      "Seque com microfibra limpa, sem pressionar demais, para evitar marcas e garantir brilho uniforme.",
      "No interior, aspire bancos e tapetes, limpe painéis e plásticos com produto adequado e cuidado com partes elétricas.",
      "Finalize conferindo vidros, retrovisores e detalhes, apresente o resultado ao cliente e agradeça pela confiança.",
    ],
    questions: [
      {
        question: "Qual atitude é recomendada ao receber o carro do cliente?",
        options: [
          "Cumprimentar com respeito, ouvir solicitações específicas e checar itens pessoais",
          "Ligar imediatamente o som para testar",
          "Começar a lavar sem perguntar nada",
          "Circular com o carro para verificar o motor",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que fazer pré-lavagem na lataria?",
        options: [
          "Para remover sujeiras soltas e evitar riscos na pintura",
          "Para gastar mais água",
          "Para deixar o carro molhado por mais tempo",
          "Para evitar usar shampoo automotivo",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como evitar arranhões durante a lavagem?",
        options: [
          "Usando luva macia limpa e panos diferentes para cada parte",
          "Utilizando vassoura de piaçava",
          "Esfregando com esponja de aço",
          "Aplicando detergente de cozinha puro",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é o cuidado correto com o interior do veículo?",
        options: [
          "Aspirar com atenção, usar produtos específicos e evitar excesso de água em partes elétricas",
          "Jogar água diretamente no painel",
          "Aplicar perfume sem consultoria",
          "Retirar bancos para lavar por dentro",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como demonstrar gentileza durante o serviço?",
        options: [
          "Comunicando com educação cada etapa e informando progressos",
          "Falando somente no final",
          "Pedindo ao cliente para não observar",
          "Pedindo gorjeta antes de terminar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que fazer se perceber arranhões ou danos no veículo antes de lavar?",
        options: [
          "Informar o cliente com respeito antes de iniciar",
          "Esconder os danos para evitar discussões",
          "Tentar polir sem autorização",
          "Culpar o cliente pelo estado do carro",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como proceder com itens pessoais encontrados no carro?",
        options: [
          "Guardar em local seguro e avisar o cliente",
          "Descartar para liberar espaço",
          "Mover para o porta-malas sem avisar",
          "Publicar nas redes sociais",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual é a melhor forma de secar o carro?",
        options: [
          "Usar pano de microfibra limpo em movimentos suaves",
          "Deixar secar ao sol com manchas",
          "Utilizar papel comum",
          "Secar com pano de chão usado",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como finalizar o atendimento de maneira profissional?",
        options: [
          "Apresentar o resultado ao cliente, agradecer e orientar sobre cuidados",
          "Deixar o carro aberto e ir embora",
          "Pedir avaliação sem mostrar o interior",
          "Cobrar taxa extra pela conversa",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se faltar produto indicado pelo manual do cliente, o que fazer?",
        options: [
          "Comunicar o cliente e combinar alternativa segura",
          "Usar qualquer produto químico forte",
          "Cancelar o serviço",
          "Pegar emprestado com vizinhos",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  montagem_moveis: {
    label: "Montagem de Móveis",
    summary: "Leitura de instruções, segurança com ferramentas e respeito ao espaço do cliente.",
    content: [
      "Cumprimente o cliente, confirme o local de montagem e proteja o piso com mantas ou papelão quando necessário.",
      "Leia o manual antes de iniciar, conferindo parafusos, peças e ferragens disponíveis.",
      "Separe ferramentas adequadas e mantenha-as organizadas para evitar perdas ou acidentes.",
      "Monte o móvel seguindo a ordem recomendada, apertando parafusos gradualmente e verificando prumo e nível.",
      "Trate o cliente com gentileza, explicando cada etapa e pedindo autorização antes de fazer furos ou ajustes extra.",
      "Ao concluir, limpe resíduos, apresente o móvel instalado e agradeça pela confiança.",
    ],
    questions: [
      {
        question: "Qual é a atitude correta antes de iniciar a montagem?",
        options: [
          "Cumprimentar com cordialidade, alinhar local de instalação e proteger o piso",
          "Abrir todas as caixas e começar sem planejamento",
          "Pedir para o cliente montar junto",
          "Colocar as peças em qualquer lugar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que ler o manual é essencial?",
        options: [
          "Para conferir peças, entender etapas e evitar erros",
          "Apenas para ver figuras",
          "Porque o cliente exige",
          "Para descartar peças sobrando",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como organizar as ferramentas durante o serviço?",
        options: [
          "Separar as necessárias, manter próximas e em local seguro",
          "Espalhar pelo chão para visualizar",
          "Pedir emprestado conforme surgem",
          "Usar qualquer objeto para substituir",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual técnica evita danos ao apertar parafusos?",
        options: [
          "Apertar gradualmente, alternando lados conforme o manual",
          "Apertar ao máximo desde o início",
          "Bater com martelo para fixar",
          "Usar cola para substituir parafusos",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como demonstrar respeito pelo espaço do cliente?",
        options: [
          "Manter o local limpo, organizar peças e comunicar cada avanço",
          "Falar alto para marcar presença",
          "Utilizar os móveis já montados como apoio",
          "Colocar caixas vazias no caminho",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se faltar algum parafuso indicado no manual, como proceder?",
        options: [
          "Avisar o cliente e buscar solução em conjunto",
          "Usar qualquer prego disponível",
          "Montar mesmo assim e esconder a falta",
          "Cancelar o serviço sem explicar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que verificar prumo e nível é importante?",
        options: [
          "Para garantir estabilidade, segurança e um acabamento profissional",
          "Para gastar mais tempo",
          "Porque o cliente gosta de ver ferramentas",
          "Para poder tirar fotos alinhadas",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual comportamento reforça atendimento gentil?",
        options: [
          "Ouvir o cliente, responder dúvidas e agradecer a confiança",
          "Falar apenas quando surgir um problema",
          "Reclamar da qualidade do móvel",
          "Exigir silêncio absoluto",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se for necessário fazer um furo extra na parede, o que fazer?",
        options: [
          "Solicitar autorização do cliente, explicar o motivo e garantir segurança",
          "Fazer o furo sem comentar",
          "Pedir gorjeta por cada furo",
          "Deixar para o cliente decidir outro dia",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como finalizar o serviço de forma profissional?",
        options: [
          "Limpar resíduos, apresentar o móvel montado e agradecer",
          "Deixar as sobras espalhadas",
          "Sair sem avisar que terminou",
          "Cobrar taxa extra pela limpeza",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
  passeio_pets: {
    label: "Passeio com Pets",
    summary: "Bem-estar animal, segurança nas ruas e gentileza com tutores.",
    content: [
      "Cumprimente o tutor com simpatia, conheça a rotina do pet e confirme horários e duração do passeio.",
      "Verifique o equipamento fornecido (coleira, guia, enforcador ou peitoral) e ajuste com cuidado para evitar fugas.",
      "Avalie o comportamento do animal, mantendo ritmo adequado e reforçando comandos básicos combinados com o tutor.",
      "Leve água fresca, saquinhos para recolher dejetos e evite locais perigosos ou com temperatura extrema.",
      "Envie atualizações ao tutor durante o passeio quando combinado, demonstrando atenção e respeito.",
      "Ao retornar, limpe as patas do pet se necessário, compartilhe observações e agradeça pela confiança.",
    ],
    questions: [
      {
        question: "Qual é o primeiro passo antes de iniciar o passeio?",
        options: [
          "Cumprimentar o tutor, entender a rotina do pet e alinhar duração",
          "Sair imediatamente para aproveitar o tempo",
          "Testar se o pet obedece comandos sem perguntar",
          "Dar petiscos sem autorização",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que ajustar a coleira ou peitoral corretamente é importante?",
        options: [
          "Para evitar fugas, mantê-lo confortável e seguro",
          "Para deixar a coleira enfeitada",
          "Para mostrar que o pet tem dono",
          "Para poder correr mais rápido",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual atitude demonstra cuidado durante o passeio?",
        options: [
          "Manter ritmo indicado pelo tutor, observar sinais do pet e evitar locais perigosos",
          "Correr o máximo possível para cansar o animal",
          "Deixar o pet solto em áreas movimentadas",
          "Ignorar comandos combinados",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "O que nunca deve faltar no passeio?",
        options: [
          "Água, saquinhos para dejetos e atenção ao bem-estar",
          "Brinquedos barulhentos",
          "Roupas para trocar o pet",
          "Coleira de enforcamento apertada",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como manter boa relação com o tutor durante o serviço?",
        options: [
          "Enviar atualizações combinadas, responder dúvidas e ser gentil",
          "Pedir para não receber mensagens",
          "Exigir elogios públicos",
          "Cobrar taxa por cada foto enviada",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se o pet demonstrar desconforto ou medo, o que fazer?",
        options: [
          "Reduzir o ritmo, confortar com comandos conhecidos e avisar o tutor",
          "Ignorar para ele se acostumar",
          "Forçar a continuar no mesmo local",
          "Puxar a guia com força",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Como garantir higiene durante o passeio?",
        options: [
          "Recolher dejetos com saquinhos e descartar corretamente",
          "Deixar o tutor recolher depois",
          "Esconder debaixo de folhas",
          "Jogar na rua para outra pessoa limpar",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Qual atitude mostrar ao retornar com o pet?",
        options: [
          "Limpar patas se necessário, relatar como o passeio foi e agradecer",
          "Soltar o pet na porta e ir embora",
          "Entrar sem avisar para procurar comida",
          "Esconder informações sobre o passeio",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Por que manter comunicação cordial é essencial?",
        options: [
          "Constrói confiança, evita mal-entendidos e valoriza o serviço",
          "Ajuda a cobrar mais caro",
          "Porque o tutor gosta de conversar",
          "Para poder pedir presentes",
        ],
        correctOptionIndex: 0,
      },
      {
        question: "Se chover forte durante o passeio, qual é a melhor decisão?",
        options: [
          "Buscar abrigo seguro, avisar o tutor e adaptar a rota",
          "Continuar correndo para terminar no horário",
          "Deixar o pet solto na chuva",
          "Concluir o passeio sem informar",
        ],
        correctOptionIndex: 0,
      },
    ],
  },
};

const normalizedAliases = Object.entries(rawAliases).reduce((acc, [key, names]) => {
  acc[key] = names.map((name) => normalizeKey(name));
  return acc;
}, {});

export const resolveTrainingModuleKey = (serviceName = "", serviceCategory = "") => {
  const candidates = [serviceName, serviceCategory].filter(Boolean);
  for (const candidate of candidates) {
    const normalized = normalizeKey(candidate);
    for (const [key, aliasList] of Object.entries(normalizedAliases)) {
      if (aliasList.includes(normalized)) {
        return key;
      }
    }
  }
  return null;
};

export const getTrainingModule = (key) => trainingModules[key] || null;

export const listTrainingKeys = () => Object.keys(trainingModules);
