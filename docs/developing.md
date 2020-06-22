Developing
==========

# Releasing a new version
A list of reminders to make sure I don't forget any steps:

- Update the version in package.json
- `npm run build`
- Run each example (TODO: automated testing?)
- `git add -A`
- `git commit -m "commit message"`
- `git tag -a #.#.# -m "tag annotation"`
- `git push --tags`
- `npm publish`
- (maybe optional) Edit / document the release on Github
