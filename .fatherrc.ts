import { defineConfig } from "father";
import path from "path";

function getProjectPath(...filePath) {
  return path.join(process.cwd(), "src", ...filePath);
}

export default defineConfig({
  esm: {},
  alias: {
    [`choerodon-ui/dataset`]: getProjectPath("components-dataset"),
    [`choerodon-ui/shared`]: getProjectPath("components-shared"),
    [`choerodon-ui/pro/lib`]: getProjectPath("components-pro"),
    [`choerodon-ui/pro`]: getProjectPath("index-pro"),
    [`choerodon-ui/lib`]: getProjectPath("components"),
  },
});
