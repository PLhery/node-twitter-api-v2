## Release Process Prompt

Perform a new release.

Instructions:
1. Get the latest git tag using `git describe --tags --abbrev=0`. 
2. Get all commit messages since the latest tag using `git log <latest_tag>..HEAD --pretty=format:"%s"`. 
3. Determine the next version number based on the changes since the last tag. Use semantic versioning principles: increment the patch version for bug fixes and the minor version for new features. 
4. For each commit message:
    a.  Extract the commit description and the pull request number. The format is typically `<description> (#<pr_number>)`.
    b.  Fetch the pull request details from the GitHub API using the command: `curl -s https://api.github.com/repos/plhery/node-twitter-api-v2/pulls/<pr_number>`.
    c.  From the JSON response, extract the author's GitHub username from the `user.login` field.
    d.  Format the changelog entry as: `- <commit description> #<pr_number> (@<github_username>)`
5. Update the `version` in `package.json` to the new version number provided. 
6. Prepend the new version and the formatted changelog entries to `changelog.md`, following the existing structure:
    <version>
    ------
    <formatted_changelog_entries>
7. Run `npm install` to update `package-lock.json` to reflect the new version.
8. Finally, commit with the name `upgrade to <version-number>`