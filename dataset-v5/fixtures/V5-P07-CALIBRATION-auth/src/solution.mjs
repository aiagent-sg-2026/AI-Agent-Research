export function decideAccess(i={}){if(i.active===false)return {allowed:false,reason:'inactive'};return {allowed:false,reason:'default-deny'}}
