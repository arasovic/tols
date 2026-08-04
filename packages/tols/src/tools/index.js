// Tool registry aggregator: importing this module registers every CLI tool.
// New tools: create src/tools/<name>.js (default export = tool def), then add
// the register call here.
import { register } from '../registry.js';
import base64 from './base64.js';
import url from './url.js';
import json from './json.js';
import yaml from './yaml.js';
import diff from './diff.js';
import timestamp from './timestamp.js';
import cron from './cron.js';
import uuid from './uuid.js';
import hash from './hash.js';
import jwt from './jwt.js';

register(base64);
register(url);
register(json);
register(yaml);
register(diff);
register(timestamp);
register(cron);
register(uuid);
register(hash);
register(jwt);
