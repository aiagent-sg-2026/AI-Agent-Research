const D={safe:{burst:4,windowMs:1000},fast:{burst:7,windowMs:1000}};export function resolveSettings(i={},r='xx'){const mode=i?.mode??'safe';return {mode,limits:{...D[mode]??D.safe},region:r};}
