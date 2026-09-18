export async function runUpgrade(steps,driver){for(const s of steps)await driver.execute(s);return {status:'committed',completed:steps.length};}
