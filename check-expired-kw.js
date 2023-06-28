// -*- encoding: utf-8; -*-

const fs = require('fs');
const chinachu_api = require('./chinachu.js');
const argv = require('minimist')(process.argv.slice(2));
const base_path = new URL(argv.c || argv.chinachu || 'http://localhost:10772/api/');
const api = new chinachu_api.ChinachuAPI(base_path);


async function getKeywords() {
  try {
    // const reserves = await api.getReserves();
    const programs = await api.getPrograms();
    const rules = await api.getRules();

    console.log("【一致なし予約キーワード】");

    for(let rule of rules) {
      if(rule.isDisabled)
        continue;
      let titles = rule.reserve_titles;
      if(titles.length == 0)
        continue;

      if(!programs.some((r) =>
                        titles.every((t) =>
                                     ['title', 'fullTitle'].some((c) =>
                                                          r[c].indexOf(t) !== -1)
                                    )
                       )
        ) {
        console.log(rule.reserve_titles.join(', '));
      }
    }
  } catch(e) {
    throw e;
  }
}

async function checkIgnoreKeywords() {
  try {
    const programs = await api.getPrograms();
    const ignores = fs.readFileSync('ignore_keywords.txt', 'utf8').split(/\r?\n/);

    console.log();
    console.log("【一致なし無視キーワード】");

    for(let kw of ignores) {
      if(kw.trim() === "")
        continue;
      if(/^#/.test(kw))
        continue;

      if(!programs.some((pg) =>
                        ['title', 'fullTitle', 'detail'].some((c) =>
                                                              pg[c].indexOf(kw) !== -1)
                       )
        ) {
        console.log(kw);
      }
    }
    
  } catch(e) {
    throw e;
  }
}

async function main() {
  await getKeywords();
  await checkIgnoreKeywords();
}

main();

