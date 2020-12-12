const dibo = require('../libs/dibo');

// Add a structure to store ongoing purge actions
if(!dibo.hasOwnProperty('cyborg')){
    dibo['cyborg'] = {}
}
dibo.cyborg['purges'] = {};
