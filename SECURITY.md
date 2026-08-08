# Security

## Reporting a vulnerability

Please report security issues privately through
[GitHub's advisory form](https://github.com/arasovic/tols/security/advisories/new)
rather than opening a public issue. I will confirm receipt within a few days and
tell you either a fix timeline or why I think it is not an issue.

## Supported versions

The latest published version of the `tols-cli` npm package, and the current
deployment of the website. There are no long term support branches.

## What the threat model is

The website runs entirely in the browser. There is no backend, no account and no
analytics, and no input you type is transmitted anywhere. Tool state is kept in
`localStorage` and, for the tools with shareable links, in the URL fragment.
The fragment is deliberate: browsers do not send it in the HTTP request, so a
shared link's contents never reach a server, not even the one hosting the site.

Two consequences worth knowing:

- **A shared link contains your input.** The share feature encodes tool state
  into the URL. Do not share a link from the JWT encoder if the token was signed
  with a real secret.
- **`localStorage` is not a secret store.** Anything the site remembers between
  visits is readable by any script running on the same origin.

The CLI reads from arguments, stdin and `@file` paths, writes to stdout, and
makes no network requests.

## Things that are known and are not vulnerabilities

- `tols regex match` and the regex tester run patterns you supply. A
  catastrophically backtracking pattern will hang the process. The website runs
  them in a Worker with a five second timeout; the CLI runs them synchronously
  and does not.
- The `html` and `xml` tools use a hand written tag scanner, not a full parser.
  They are formatters, not sanitisers, and their output should not be trusted as
  safe to inject into a page.
