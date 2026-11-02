// Entirely fictional fixtures. The reserved .example domain is intentionally non-deliverable.
export const DEMO_CONTENT_VERSION=1;
const directory=[
 ['Ana Martins','Supervisora de RH','Recursos Humanos','ana.martins@horizonte.example','2201','1º andar · sala 101','supervisor'],
 ['Bruno Lima','Analista de suporte','Tecnologia da Informação','bruno.lima@horizonte.example','2301','2º andar · sala 201','auxiliar'],
 ['Camila Rocha','Assistente de atendimento','Recepção','camila.rocha@horizonte.example','2100','Térreo · entrada principal','auxiliar'],
 ['Diego Santos','Analista financeiro','Financeiro','diego.santos@horizonte.example','2401','1º andar · sala 102','supervisor'],
 ['Eduardo Costa','Consultor comercial','Comercial','eduardo.costa@horizonte.example','2501','2º andar · sala 202','auxiliar'],
 ['Fernanda Alves','Analista de comunicação','Marketing','fernanda.alves@horizonte.example','2601','2º andar · sala 203','auxiliar'],
 ['Gabriel Mendes','Comprador','Compras','gabriel.mendes@horizonte.example','2701','1º andar · sala 103','supervisor'],
 ['Helena Duarte','Supervisora de operações','Operações','helena.duarte@horizonte.example','2801','Térreo · sala 005','supervisor'],
 ['Isabela Nunes','Assistente de infraestrutura','Facilities','isabela.nunes@horizonte.example','2901','Térreo · sala 006','auxiliar'],
 ['João Ribeiro','Assistente de logística','Logística','joao.ribeiro@horizonte.example','3001','Térreo · área de recebimento','auxiliar'],
 ['Lucas Barros','Aprendiz de projetos','Projetos','lucas.barros@horizonte.example','3101','3º andar · sala 301','aprendiz'],
 ['Marina Torres','Diretora administrativa','Diretoria','marina.torres@horizonte.example','3201','3º andar · sala 302','supervisor']
];
const activities={
 'Recursos Humanos':'Benefícios, integração, férias e dúvidas sobre o cadastro de colaboradores.',
 'Tecnologia da Informação':'Suporte a computadores, contas de acesso e equipamentos.',
 'Recepção':'Orientação de visitantes, correspondências e localização de salas.',
 'Financeiro':'Notas fiscais, reembolsos e acompanhamento de pagamentos.',
 'Comercial':'Propostas, relacionamento com clientes e novos negócios.',
 'Marketing':'Comunicação, materiais de divulgação e identidade visual.',
 'Compras':'Pedidos de materiais, cotações e contato com fornecedores.',
 'Operações':'Planejamento das atividades e apoio à execução do dia a dia.',
 'Facilities':'Manutenção, limpeza, infraestrutura e reservas de espaços.',
 'Logística':'Recebimento, organização de entregas e movimentação de materiais.',
 'Projetos':'Organização de iniciativas, reuniões e acompanhamento de entregas.',
 'Diretoria':'Decisões administrativas e alinhamento das prioridades da empresa.'
};
const sectorLabel=sector=>({'Recursos Humanos':'Recursos Humanos (RH)','Tecnologia da Informação':'Tecnologia da Informação (TI)'}[sector]||sector);
export function demoContent(){
 const updatedAt=new Date().toISOString();
 const page=(id,title,body,columns,rows,profileIds=[])=>({id:'demo-'+id,title,body:'Empresa Horizonte · dados inteiramente fictícios para teste. '+body,link:'',table:{columns,rows},audience:profileIds.length?'profiles':'everyone',profileIds,status:'published',updatedAt});
 const pages=[
  page('ramais','Lista de ramais','Encontre o ramal interno de cada setor e a pessoa de referência. Os números não correspondem a contatos reais.',
   ['Setor','Ramal','Pessoa de referência','Local'],directory.map(([name,,sector,,extension,location])=>[sectorLabel(sector),extension,name,location])),
  page('setores','Setores da empresa','Veja onde fica cada departamento e quais assuntos ele atende.',
   ['Setor','O que resolve','Responsável','Local'],directory.map(([name,,sector,,,location])=>[sectorLabel(sector),activities[sector],name,location])),
  page('contatos','Contatos e e-mails','Consulte nomes, cargos e emails de exemplo. Todos os endereços usam o domínio reservado horizonte.example e não devem receber mensagens.',
   ['Pessoa','Cargo','Setor','E-mail','Ramal'],directory.map(([name,role,sector,email,extension])=>[name,role,sectorLabel(sector),email,extension])),
  page('onde-resolver','Onde resolver cada assunto','Não sabe quem procurar? Pesquise o que precisa e encontre a área indicada.',
   ['Preciso de…','Procurar','Como entrar em contato'],[
    ['Ajuda com computador ou impressora','Tecnologia da Informação','Bruno Lima · ramal 2301'],
    ['Informações sobre férias ou benefícios','Recursos Humanos','Ana Martins · ramal 2201'],
    ['Acompanhar um reembolso','Financeiro','Diego Santos · ramal 2401'],
    ['Comprar materiais de escritório','Compras','Gabriel Mendes · ramal 2701'],
    ['Reservar uma sala de reunião','Facilities','Isabela Nunes · ramal 2901'],
    ['Receber uma encomenda','Logística','João Ribeiro · ramal 3001'],
    ['Solicitar material de divulgação','Marketing','Fernanda Alves · ramal 2601'],
    ['Localizar um visitante ou uma sala','Recepção','Camila Rocha · ramal 2100']
   ]),
  page('espacos','Salas e espaços','Localize ambientes de uso comum e saiba como utilizá-los.',
   ['Ambiente','Local','Capacidade','Como utilizar'],[
    ['Sala Horizonte','1º andar · sala 110','8 pessoas','Solicitar reserva a Facilities, ramal 2901.'],
    ['Sala Inovação','2º andar · sala 210','12 pessoas','Combinar a reserva com a equipe de Projetos, ramal 3101.'],
    ['Sala Foco','2º andar · sala 211','2 pessoas','Uso breve para chamadas; conferir disponibilidade na recepção.'],
    ['Espaço de treinamento','3º andar · sala 310','24 pessoas','Agendar com Recursos Humanos, ramal 2201.'],
    ['Copa','Térreo · ao lado do pátio','Uso compartilhado','Manter o espaço organizado após o uso.'],
    ['Recebimento de materiais','Térreo · acesso lateral','Área de apoio','Procurar Logística antes de retirar uma entrega.']
   ]),
  page('horarios','Serviços e horários','Horários fictícios para testar consultas sobre atendimento e serviços.',
   ['Serviço','Dias','Horário','Referência'],[
    ['Recepção e visitantes','Segunda a sexta','08h às 18h','Ramal 2100'],
    ['Suporte de TI','Segunda a sexta','08h às 17h','Ramal 2301'],
    ['Atendimento de RH','Segunda a sexta','09h às 12h e 14h às 17h','Ramal 2201'],
    ['Recebimento de entregas','Segunda a sexta','08h às 16h','Ramal 3001'],
    ['Atendimento financeiro','Segunda a sexta','09h às 16h','Ramal 2401'],
    ['Reserva de salas','Segunda a sexta','08h às 17h','Ramal 2901']
   ]),
  page('aprovacoes','Aprovações e responsáveis','Exemplo exclusivo da simulação de Supervisor. Os demais perfis não herdam esse conteúdo.',
   ['Solicitação','Responsável pela análise','Encaminhamento'],[
    ['Compra de materiais','Gabriel Mendes','Compras · ramal 2701'],
    ['Ajuste no planejamento da equipe','Helena Duarte','Operações · ramal 2801'],
    ['Reserva de treinamento','Ana Martins','Recursos Humanos · ramal 2201'],
    ['Reembolso de despesa','Diego Santos','Financeiro · ramal 2401'],
    ['Decisão administrativa','Marina Torres','Diretoria · ramal 3201']
   ],['supervisor']),
  page('apoio','Rotinas de apoio','Exemplo exclusivo da simulação de Auxiliar, com instruções fictícias do dia a dia.',
   ['Atividade','Quando','Orientação'],[
    ['Conferir materiais','Início do turno','Verificar os itens necessários e anotar o que está faltando.'],
    ['Organizar o espaço','Antes de iniciar','Deixar os materiais identificados e os acessos livres.'],
    ['Registrar uma pendência','Quando identificar um problema','Anotar o assunto e informar a pessoa responsável.'],
    ['Encaminhar uma entrega','Ao receber um volume','Conferir o destinatário com Logística, ramal 3001.'],
    ['Finalizar as atividades','Fim do turno','Compartilhar as pendências com a próxima equipe.']
   ],['auxiliar']),
  page('integracao','Integração de aprendizes','Exemplo exclusivo da simulação de Aprendiz. Pesquise aqui os primeiros passos na empresa fictícia.',
   ['Etapa','O que fazer','Quem pode ajudar'],[
    ['Boas-vindas','Conhecer a equipe e o espaço de trabalho.','Ana Martins · Recursos Humanos'],
    ['Acesso ao computador','Conferir o equipamento e pedir orientação para o primeiro acesso.','Bruno Lima · TI'],
    ['Organização das atividades','Combinar tarefas e horários com a pessoa responsável.','Helena Duarte · Operações'],
    ['Conhecer os projetos','Participar da apresentação das iniciativas da equipe.','Lucas Barros · Projetos'],
    ['Dúvidas frequentes','Anotar perguntas e consultar a página Onde resolver cada assunto.','Camila Rocha · Recepção']
   ],['aprendiz'])
 ];
 const people=directory.map(([name,,sector,email,,,profile])=>({id:'demo-pessoa-'+email.split('@')[0].replaceAll('.','-'),name,email,profileIds:[profile],admin:false}));
 return {pages,people};
}
export function appendDemoContent(data){
 if((data.demoContentVersion||0)>=DEMO_CONTENT_VERSION)return data;
 const examples=demoContent(),pageIds=new Set(data.pages.map(page=>page.id));
 data.pages=[...examples.pages.filter(page=>!pageIds.has(page.id)),...data.pages];
 for(const person of examples.people)if(!data.people.some(existing=>existing.id===person.id||existing.email?.toLowerCase()===person.email))data.people.push(person);
 data.demoContentVersion=DEMO_CONTENT_VERSION;
 return data;
}
