import "./cityParser.test";
import "./config.test";
import "./history.test";
import { runCheckRunnerTests } from "./checkRunner.test";

void runCheckRunnerTests()
  .then(() => {
    console.log("All tests passed");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
