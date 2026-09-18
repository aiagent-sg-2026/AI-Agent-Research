export function authorizeAction(i={}){if(i.locked)return {allowed:false,reason:'locked'};return {allowed:false,reason:'role-deny'}}
