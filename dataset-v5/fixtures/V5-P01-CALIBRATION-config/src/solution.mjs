export function resolveSettings(input={},region='xx'){return {mode:input?.mode??'safe',limits:{burst:4,windowMs:1000},region};}
