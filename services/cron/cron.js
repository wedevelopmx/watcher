const CronJob = require('cron').CronJob;
const { exec } = require('child_process');

console.log(`>> ${new Date()} Service up`);


let cronjobs = [
  { name: 'datetime', schedule: '00 */15 * * * *', command: 'node scripts/dm.js 2>> log/dm.log'},
  { name: 'unfollow', schedule: '00 */15 * * * *', command: 'node scripts/unfollow.js 2>> log/unfollow.log'},
  // { name: 'analytics', schedule: '00 * */1 * * *', command: 'node scripts/user-analytics.js 2>> log/user-analytics.log'},
  { name: 'last-seen', schedule: '00 * 7 * * *', command: 'node scripts/last-seen-lead.js 2>> log/last-seen-lead.log'}
];

cronjobs.forEach(cronjob => {
  new CronJob(cronjob.schedule, function() {
    exec(cronjob.command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`>> ${cronjob.name} executed at ${new Date()}`)
      // console.log(`stdout: ${stdout}`);
      // console.log(`stderr: ${stderr}`);
    });

  }, null, true, 'America/Mexico_City');

});
