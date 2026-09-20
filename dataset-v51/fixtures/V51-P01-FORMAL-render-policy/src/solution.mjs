export function resolveRenderPolicy(input={},region='global'){return {profile:input?.profile??'eco',tuning:{batch:3,deadlineMs:1200},region}}
