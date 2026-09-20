export function decidePortalAccess(i={}){if(i.inactive===true)return {allowed:false,reason:'inactive'};return {allowed:false,reason:'default-deny'}}
