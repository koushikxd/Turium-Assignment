import { initLogger } from "evlog";
import { createMemoryDrain } from "evlog/memory";

initLogger({ silent: true, drain: createMemoryDrain() });
