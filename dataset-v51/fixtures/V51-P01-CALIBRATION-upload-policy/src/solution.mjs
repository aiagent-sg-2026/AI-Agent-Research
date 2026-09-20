export function resolveUploadPolicy(input={},zone='core'){return {mode:input?.mode??'normal',limits:{chunks:4,timeoutMs:900},zone}}
