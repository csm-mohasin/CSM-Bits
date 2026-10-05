loadCfg().then(c=>{applyCfg(c);refreshAccent()});
chrome.storage.onChanged.addListener(ch=>{if(ch.cfg){applyCfg({...DEF,...ch.cfg.newValue});refreshAccent()}});
