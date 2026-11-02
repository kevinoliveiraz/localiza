/** Cenário fictício multissetorial. Os dados desta demonstração ficam no navegador. */
export const defaultBuildings = [
  { id:'central', name:'Edifício Central', short:'Central', floors:['Térreo','1º Andar','2º Andar'] },
  { id:'criativo', name:'Anexo Criativo', short:'Criativo', floors:['Térreo','1º Andar'] },
  { id:'oficinas', name:'Pavilhão de Oficinas', short:'Oficinas', floors:['Térreo'] }
];
export const defaultRooms = [
  { id:'NX-001', name:'Recepção', building:'central', floor:'Térreo', dept:'Operações', groups:[], visibility:'interno', status:'Publicado', size:64, icon:'pin', description:'Um ponto de chegada para receber pessoas e orientar os próximos passos.', x:6, y:9, w:42, h:37 },
  { id:'NX-002', name:'Espaço Conexão', building:'central', floor:'Térreo', dept:'Operações', groups:[], visibility:'interno', status:'Publicado', size:92, icon:'users', description:'Área compartilhada para encontros, pausas e conversas que aproximam equipes.', x:51, y:9, w:43, h:37 },
  { id:'NX-003', name:'Sala Aurora', building:'central', floor:'1º Andar', dept:'Projetos', groups:['Projetos','Gestão'], visibility:'restrito', status:'Publicado', size:36, icon:'briefcase', description:'Um espaço tranquilo para reuniões de projeto e trabalho em conjunto.', x:6, y:9, w:42, h:37 },
  { id:'NX-004', name:'Laboratório de Ideias', building:'central', floor:'1º Andar', dept:'Tecnologia', groups:['Tecnologia'], visibility:'restrito', status:'Em revisão', size:58, icon:'monitor', description:'Um ambiente de experimentação para transformar ideias em protótipos.', x:51, y:9, w:43, h:37 },
  { id:'NX-005', name:'Sala Horizonte', building:'central', floor:'2º Andar', dept:'Gestão', groups:['Gestão'], visibility:'restrito', status:'Publicado', size:28, icon:'building', description:'Sala de planejamento com espaço para focar no que vem a seguir.', x:6, y:9, w:88, h:37 },
  { id:'NX-006', name:'Estúdio de Criação', building:'criativo', floor:'Térreo', dept:'Projetos', groups:['Projetos'], visibility:'restrito', status:'Em revisão', size:74, icon:'cube', description:'Um espaço flexível para criar, explorar referências e desenvolver novas soluções.', x:6, y:9, w:88, h:37 },
  { id:'NX-007', name:'Oficina de Prototipagem', building:'oficinas', floor:'Térreo', dept:'Operações', groups:['Operações','Tecnologia'], visibility:'restrito', status:'Publicado', size:120, icon:'settings', description:'Bancadas e áreas de apoio para materializar e testar novos projetos.', x:6, y:9, w:88, h:37 }
];
export const defaultDepts = [
  {name:'Operações',color:'mint',icon:'settings'}, {name:'Projetos',color:'violet',icon:'briefcase'},
  {name:'Tecnologia',color:'sky',icon:'monitor'}, {name:'Gestão',color:'peach',icon:'building'}
];
export const defaultMembers = [
  {name:'Alex Martins',email:'alex@example.invalid',groups:['Gestão'],role:'Proprietário',status:'Ativo'},
  {name:'Beatriz Costa',email:'beatriz@example.invalid',groups:['Projetos'],role:'Colaborador',status:'Ativo'},
  {name:'Caio Oliveira',email:'caio@example.invalid',groups:['Operações'],role:'Colaborador',status:'Ativo'},
  {name:'Dani Souza',email:'dani@example.invalid',groups:['Tecnologia'],role:'Colaborador',status:'Convite local'}
];
