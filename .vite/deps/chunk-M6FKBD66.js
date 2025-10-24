import {
  require_jsx_runtime
} from "./chunk-H5T3MFG3.js";
import {
  require_react
} from "./chunk-P4I6WM76.js";
import {
  __toESM
} from "./chunk-2GTGKKMZ.js";

// node_modules/@radix-ui/react-direction/dist/index.mjs
var React = __toESM(require_react(), 1);
var import_jsx_runtime = __toESM(require_jsx_runtime(), 1);
var DirectionContext = React.createContext(void 0);
function useDirection(localDir) {
  const globalDir = React.useContext(DirectionContext);
  return localDir || globalDir || "ltr";
}

export {
  useDirection
};
//# sourceMappingURL=chunk-M6FKBD66.js.map
