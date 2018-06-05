// Create React App doesn't have an easy way to set run-time environment
// variables. Here we copy
// https://github.com/facebook/create-react-app/issues/578#issuecomment-277843310

window.env = {
  // This option can be retrieved in "src/index.js" with "window.env.API_URL".
  API_URL: 'API_URL_REPLACE_ME'
};
