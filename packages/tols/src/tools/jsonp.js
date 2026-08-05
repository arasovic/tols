import * as core from '../core/jsonp.js';
import { UsageError } from '../io.js';

function checkCallback(flags) {
  const callback = typeof flags.callback === 'string' ? flags.callback : 'callback';
  if (!core.isValidCallback(callback)) {
    throw new UsageError(`invalid callback name: ${callback} (must be a JS identifier)`);
  }
  return callback;
}

export default {
  name: 'jsonp',
  defaultAction: 'wrap',
  actions: {
    wrap: {
      description: 'wrap a JSON payload in a callback: cb({...}) (--callback=name, default "callback")',
      run: (input, flags) => {
        const callback = checkCallback(flags);
        return core.wrapResponse(callback, input);
      },
    },
    script: {
      description: 'build the JSONP <script> tag (--url required, --callback=name)',
      needsInput: false,
      run: (_input, flags) => {
        const url = typeof flags.url === 'string' ? flags.url : '';
        if (!url) throw new UsageError('--url is required');
        if (!core.isValidUrl(url)) throw new UsageError(`invalid URL: ${url}`);
        const callback = checkCallback(flags);
        return core.scriptTag(url, callback);
      },
    },
  },
};
