# source-http-legacy

Implements a `pull` command to load a remote emergence site's file tree into a git tree within the local active repository.

## Basic Usage

```bash
npm install -g @emergence/source-http-legacy
git init my-site-repo
cd my-site-repo
emergence-source-http-legacy pull mysite.example.org
```

See `emergence-source-http-legacy --help` output for complete options

## Help and Support

Visit the [discussion topic on the emergence forum](http://forum.emr.ge/t/pull-any-site-into-a-git-repo/111)

## Roadmap

- [ ] Add `--update-ref=` and `--update-branch` options to `pull` command to automatically generate commits with parents
- [ ] Discover and transparently utilize remote `/.git` interface if available
- [ ] Evaluate feasibility of exposing a [git remote helper](https://git-scm.com/docs/git-remote-helpers)
