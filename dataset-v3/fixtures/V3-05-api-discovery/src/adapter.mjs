export const adapter = { async open() { return { rows: (async function*(){ yield {user_id:1,display_name:'Ada'}; })(), async close() {} }; } };
