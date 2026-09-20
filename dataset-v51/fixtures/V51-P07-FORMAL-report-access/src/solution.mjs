export function authorizeReport(i={}){if(i.locked===true)return {allowed:false,reason:'locked'};return {allowed:false,reason:'role-deny'}}
