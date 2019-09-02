
const url = require('url');
const http = require('http');

const pathes = {
  programs: '/api/schedule/programs.json',
  reserves: '/api/reserves.json',
  rules: '/api/rules.json'
};

class ChinachuAPI {  
  constructor(base) {
    this.base = base;
  }

  getJSON(path) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.base);
      const req = http.request(url, (res) => {
        res.setEncoding('utf8');

        let body = '';
        
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', (res) => {
          const json = JSON.parse(body);
          resolve(json);
        });
        
      });
      req.on('error', (e) => {
        reject(e);
      });
      req.end();
    });
  }

  getPrograms() {
    return this.getJSON(pathes.programs);
  }
  getReserves() {
    return this.getJSON(pathes.reserves);
  }
  getRules() {
    return this.getJSON(pathes.rules);
  }
};

exports.ChinachuAPI = ChinachuAPI;

