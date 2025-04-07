#!/usr/bin/env node

import { program } from "commander";
import { setupCommand } from "./client-generator/cli";

function addCommands() {
	setupCommand();
}

addCommands();
program.parse();
