import {defaultRooms,defaultBuildings,defaultDepts,defaultMembers} from './data.js';
// A chave nova preserva os dados da base anterior sem misturar os cenários.
export const storageKey='localiza_ui_v2';
export const read=()=>{try{return JSON.parse(localStorage.getItem(storageKey))||{}}catch{return {}}};
export const save=patch=>localStorage.setItem(storageKey,JSON.stringify({...read(),...patch}));
export const rooms=()=>[...defaultRooms,...(read().extraRooms||[])].map(room=>({...room,...(read().roomEdits?.[room.id]||{})}));
export const buildings=()=>[...defaultBuildings,...(read().extraBuildings||[])];
export const departments=()=>[...defaultDepts,...(read().extraDepts||[])];
export const members=()=>[...defaultMembers.map((member,index)=>index===0&&read().adminName?{...member,name:read().adminName,email:read().adminEmail||member.email}:member),...(read().extraMembers||[])];
export const organization=()=>read().organization||'Nexo Workspace';
export const accessForRoom=room=>read().demoPermissions?.[room.id]??room.groups??[];
export const buildingName=id=>buildings().find(building=>building.id===id)?.name||id;
export const recordActivity=message=>save({activity:[{message,at:new Date().toISOString()},...(read().activity||[])].slice(0,30)});
