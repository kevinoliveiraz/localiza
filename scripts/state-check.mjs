// Regressões de produto: contexto espacial, busca e cenário multissetorial.
import assert from 'node:assert/strict';
const memory=new Map();
globalThis.localStorage={getItem:key=>memory.get(key)||null,setItem:(key,value)=>memory.set(key,value)};
globalThis.document={body:{dataset:{root:'../'}}};
const {filteredRooms,views}=await import('../assets/js/views.js');
const {rooms,members,departments,save,storageKey}=await import('../assets/js/store.js');
const state={building:'central',floor:'1º Andar',query:'',filter:'Todos',roomId:'NX-003',selectedDept:'Operações',zoom:1};
assert.equal(filteredRooms(state).length,2);
assert.ok(filteredRooms(state).every(room=>room.building==='central'&&room.floor==='1º Andar'));
const annex={...state,building:'criativo',floor:'Térreo',roomId:'NX-006'};
assert.deepEqual(filteredRooms(annex).map(room=>room.id),['NX-006']);
assert.deepEqual(filteredRooms({...annex,query:'criacao'}).map(room=>room.id),['NX-006']);
assert.equal(filteredRooms({...annex,query:'inexistente'}).length,0);
assert.equal(filteredRooms({...state,floor:'Andar inexistente'}).length,0);
assert.equal(filteredRooms({...state,filter:'Em revisão'}).length,1);
assert.equal(filteredRooms({...state,filter:'Restritos'}).length,2);
for(const [page,render] of Object.entries(views)){
 document.body.dataset.root=page==='home'?'./':'../';
 const html=render(state);
 assert.doesNotMatch(html,/hospital|farm[aá]cia|\bHSP\b|SPDM|SPODM/i,`Vocabulário histórico em ${page}`);
 assert.doesNotMatch(html,/\.webp/,`Recorte histórico em ${page}`);
 assert.match(html,/<main/);
}
const before={rooms:rooms().length,members:members().length,groups:departments().length};
save({extraRooms:[{id:'TEST-LOCAL',name:'Sala de teste',building:'central',floor:'1º Andar',dept:'Projetos',status:'Em revisão',visibility:'interno',groups:[],description:'Teste',size:0}],extraMembers:[{name:'Pessoa de teste',email:'qa@example.invalid',groups:['Projetos'],role:'Colaborador',status:'Convite local'}],extraDepts:[{name:'Criação',color:'violet',icon:'users'}]});
assert.equal(rooms().length,before.rooms+1);
assert.equal(members().length,before.members+1);
assert.equal(departments().length,before.groups+1);
assert.match(views.administracao(state),/8 ambientes/);
assert.match(views.administracao(state),/5 pessoas/);
assert.match(views.administracao(state),/5 grupos/);
assert.equal(memory.has('localiza_demo_v1'),false);
assert.equal(memory.has(storageKey),true);
console.log('OK — contexto de edifício/andar, busca sem acentos, filtros, contadores e cenário genérico verificados.');
