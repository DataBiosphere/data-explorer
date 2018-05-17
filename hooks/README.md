# git secrets
* Install git secrets if you haven't done so already.
	* Mac
	  `brew install git-secrets`
	* Linux
	  git clone https://github.com/awslabs/git-secrets.git
	  sudo make install
	  
* Copy the files in this directory to `.git/hooks`. If you have previously run
`npm install` in `ui/` directory, `.git/hooks/pre-commit` will contain husky
section. Be sure to put git secrets section before husky section; otherwise git
secrets section won't run.
