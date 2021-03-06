const CronJob = require('cron').CronJob;
const { exec } = require('child_process');

console.log(`>> ${new Date()} Service up`);


let cronjobs = [
  { name: 'datetime', schedule: '00 */15 * * * *', command: 'node scripts/dm.js | tee -a log/dm.log'},
  { name: 'unfollow', schedule: '00 */15 5-23 * * *', command: 'node scripts/unfollow.js | tee -a log/unfollow.log'},
  { name: 'follow', schedule: '00 */15 7-23 * * *', command: 'node scripts/follow.js | tee -a log/follow.log'},
  // { name: 'analytics', schedule: '00 * */1 * * *', command: 'node scripts/user-analytics.js | tee -a log/user-analytics.log'},
  { name: 'last-seen', schedule: '00 00 */1 * * *', command: 'node scripts/last-seen-lead.js | tee -a log/last-seen-lead.log'}
];

cronjobs.forEach(cronjob => {
  new CronJob(cronjob.schedule, function() {
    exec(cronjob.command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`>> ${cronjob.name} executed at ${new Date()}`)
      console.log(`stdout: ${stdout}`);
      console.log(`stderr: ${stderr}`);
    });

  }, null, true, 'America/Mexico_City');

});
