// dao/authFacade.js

module.exports = {
    // In future this can fetch creds from Vault, DB, etc.
    async authenticate(username, password) {
      const validUser = 'admin';
      const validPass = 'password';
      return username === validUser && password === validPass;
    }
  };
  