// Preload: monkey-patch ALL child_process methods to add windowsHide on Windows
var cp = require("child_process");
var orig = {};

["spawn","spawnSync","execFile","execFileSync","exec","execSync"].forEach(function(name) {
  orig[name] = cp[name];
  cp[name] = function(command, args, options, callback) {
    if (process.platform !== "win32") return orig[name].apply(cp, arguments);

    if (name === "exec" || name === "execSync") {
      // exec/execSync: options is second arg
      if (typeof args === "object" && args !== null) {
        args = Object.assign({}, args, { windowsHide: true });
      } else {
        args = Object.assign({}, { windowsHide: true });
      }
      return orig[name].call(cp, command, args, callback);
    }

    // spawn/spawnSync/execFile/execFileSync
    if (typeof options === "function") { callback = options; options = {}; }
    options = Object.assign({}, options || {}, { windowsHide: true });
    return orig[name].call(cp, command, args, options, callback);
  };
});
