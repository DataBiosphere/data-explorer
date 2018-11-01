# git secrets

Note - husky pre-commit doesn't work with git-secrets. We recommend running
husky on pre-commit and not git-secrets. When [this issue](https://github.com/typicode/husky/issues/171)
is fixed, perhaps it will be easier to do both.

- Install git secrets if you haven't done so already.
  _ Mac
  `brew install git-secrets`
  _ Linux
  git clone https://github.com/awslabs/git-secrets.git
  sudo make install
- Copy the files in this directory to `.git/hooks`. If you have previously run
  `npm install` in `ui/` directory, `.git/hooks/pre-commit` will contain husky
  section. Be sure to put git secrets section before husky section; otherwise git
  secrets section won't run.
