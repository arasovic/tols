#!/usr/bin/env node
import '../src/cli.js';
import { run } from '../src/cli.js';

process.exitCode = await run(process.argv.slice(2));
